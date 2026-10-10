<?php
class ADM_Wallet {
    public function __construct() {
        add_action( 'rest_api_init', [ $this, 'register_routes' ] );
    }

    public static function get_wallet_id( $user_id, $lock = false ) {
        global $wpdb;
        $q = "SELECT id FROM {$wpdb->prefix}adm_wallets WHERE user_id = %d";
        if ( $lock ) $q .= " FOR UPDATE";
        $wallet_id = $wpdb->get_var( $wpdb->prepare( $q, $user_id ) );
        
        if ( ! $wallet_id ) {
            $wpdb->insert( "{$wpdb->prefix}adm_wallets", [ 'user_id' => $user_id ] );
            return $wpdb->insert_id;
        }
        return $wallet_id;
    }

    public static function get_balances( $wallet_id ) {
        global $wpdb;
        $row = $wpdb->get_row( $wpdb->prepare( "
            SELECT 
                SUM(cash_amount) as total_cash, 
                SUM(bonus_amount) as total_bonus 
            FROM {$wpdb->prefix}adm_wallet_transactions 
            WHERE wallet_id = %d AND status = 'COMPLETED'
        ", $wallet_id ) );

        return [
            'cash' => $row->total_cash ? (float)$row->total_cash : 0.00,
            'bonus' => $row->total_bonus ? (float)$row->total_bonus : 0.00
        ];
    }

    public static function process_transfer( $sender_user_id, $recipient_user_id, $amount, $idempotency_key ) {
        global $wpdb;
        
        if ( $amount <= 0 ) throw new Exception( 'Transfer amount must be positive.' );
        if ( $sender_user_id == $recipient_user_id ) throw new Exception( 'Cannot transfer to self.' );
        if ( ! get_userdata( $recipient_user_id ) ) throw new Exception( 'Invalid recipient.' );

        // Consistent lock ordering (lowest ID first) to prevent deadlocks
        $first_lock = min( $sender_user_id, $recipient_user_id );
        $second_lock = max( $sender_user_id, $recipient_user_id );

        $wpdb->query( 'START TRANSACTION' );

        try {
            // Lock wallets
            $w1 = self::get_wallet_id( $first_lock, true );
            $w2 = self::get_wallet_id( $second_lock, true );

            $sender_wallet_id = ( $first_lock == $sender_user_id ) ? $w1 : $w2;
            $recipient_wallet_id = ( $first_lock == $recipient_user_id ) ? $w1 : $w2;

            // Check Idempotency (has this transfer already occurred?)
            $existing = $wpdb->get_var( $wpdb->prepare( "SELECT id FROM {$wpdb->prefix}adm_wallet_transactions WHERE idempotency_key = %s", $idempotency_key ) );
            if ( $existing ) {
                $wpdb->query( 'ROLLBACK' );
                return true; // Already processed
            }

            // Verify Sender Balance (Only CASH is transferable)
            $sender_balances = self::get_balances( $sender_wallet_id );
            if ( $sender_balances['cash'] < $amount ) {
                throw new Exception( 'Insufficient cash balance.' );
            }

            // Execute Debit
            $wpdb->insert( "{$wpdb->prefix}adm_wallet_transactions", [
                'wallet_id' => $sender_wallet_id,
                'type' => 'P2P_SENT',
                'cash_amount' => -$amount,
                'bonus_amount' => 0,
                'idempotency_key' => $idempotency_key, // Only one side gets the key, or use suffixes
                'reference_type' => 'USER',
                'reference_id' => $recipient_user_id
            ]);

            // Execute Credit
            $wpdb->insert( "{$wpdb->prefix}adm_wallet_transactions", [
                'wallet_id' => $recipient_wallet_id,
                'type' => 'P2P_RECEIVED',
                'cash_amount' => $amount,
                'bonus_amount' => 0,
                'idempotency_key' => $idempotency_key . '_recv',
                'reference_type' => 'USER',
                'reference_id' => $sender_user_id
            ]);

            $wpdb->query( 'COMMIT' );
            return true;

        } catch ( Exception $e ) {
            $wpdb->query( 'ROLLBACK' );
            return new WP_Error( 'transfer_failed', $e->getMessage(), [ 'status' => 400 ] );
        }
    }

    public function register_routes() {
        register_rest_route( 'adm/v1', '/wallet/balance', [
            'methods' => 'GET',
            'callback' => function() {
                $wid = self::get_wallet_id( get_current_user_id() );
                return rest_ensure_response( self::get_balances( $wid ) );
            },
            'permission_callback' => 'is_user_logged_in'
        ]);

        register_rest_route( 'adm/v1', '/wallet/transfer', [
            'methods' => 'POST',
            'callback' => function( WP_REST_Request $request ) {
                $idem = sanitize_text_field( $request->get_header( 'Idempotency-Key' ) );
                if ( empty( $idem ) ) return new WP_Error( 'missing_idempotency', 'Required', [ 'status' => 400 ] );

                $amount = round( (float) $request->get_param( 'amount' ), 2 );
                $recipient = absint( $request->get_param( 'recipient_id' ) );
                
                $result = self::process_transfer( get_current_user_id(), $recipient, $amount, $idem );
                if ( is_wp_error( $result ) ) return $result;
                
                return rest_ensure_response([ 'success' => true ]);
            },
            'permission_callback' => 'is_user_logged_in'
        ]);
    }
}
