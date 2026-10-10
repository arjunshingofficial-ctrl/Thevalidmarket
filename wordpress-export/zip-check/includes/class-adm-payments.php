<?php
class ADM_Payments {
    public function __construct() {
        add_action( 'rest_api_init', [ $this, 'register_routes' ] );
    }

    public function register_routes() {
        register_rest_route( 'adm/v1', '/webhooks/crypto', [
            'methods' => 'POST',
            'callback' => [ $this, 'handle_crypto_webhook' ],
            'permission_callback' => '__return_true'
        ]);
        
        register_rest_route( 'adm/v1', '/payments/verify', [
            'methods' => 'POST',
            'callback' => [ $this, 'admin_manual_verification' ],
            'permission_callback' => function () {
                return current_user_can( 'administrator' );
            }
        ]);
    }

    private static function is_duplicate_event( $provider, $event_id ) {
        global $wpdb;
        $inserted = $wpdb->insert( "{$wpdb->prefix}adm_webhook_events", [
            'provider' => $provider,
            'event_id' => $event_id,
            'status' => 'PROCESSED'
        ]);
        return ( $inserted === false );
    }

    private static function verify_signature( WP_REST_Request $request ) {
        // If testing harness is active, allow isolated test logic.
        if ( defined('ADM_TESTING_HARNESS_ACTIVE') && ADM_TESTING_HARNESS_ACTIVE ) {
            $sig = $request->get_header( 'X-Crypto-Signature' );
            return $sig === 'mock-test-signature';
        }

        // Production implementation (Reject missing secrets safely instead of falling back to mock)
        $secret = get_option( 'adm_crypto_webhook_secret' );
        if ( ! $secret ) {
            return new WP_Error( 'config_error', 'Payment provider not configured.', [ 'status' => 500 ] );
        }

        $signature_header = sanitize_text_field( $request->get_header( 'X-Crypto-Signature' ) );
        if ( ! $signature_header ) return false;

        $raw_body = $request->get_body();
        $expected = hash_hmac( 'sha256', $raw_body, $secret );

        // Constant-time string comparison to prevent timing attacks
        return hash_equals( $expected, $signature_header );
    }

    public function handle_crypto_webhook( WP_REST_Request $request ) {
        $sig_check = self::verify_signature( $request );
        if ( is_wp_error( $sig_check ) ) return $sig_check;
        if ( ! $sig_check ) {
            return new WP_Error( 'invalid_signature', 'Unauthorized', [ 'status' => 401 ] );
        }

        $event_id = sanitize_text_field( $request->get_param( 'event_id' ) );
        $payload_type = sanitize_text_field( $request->get_param( 'type' ) );
        $reference_id = absint( $request->get_param( 'reference_id' ) ); 
        $amount = round( (float) $request->get_param( 'amount' ), 2 );
        $currency = sanitize_text_field( $request->get_param( 'currency' ) );

        if ( ! $event_id || ! $payload_type || ! $reference_id || ! $amount || ! $currency ) {
            return new WP_Error( 'bad_request', 'Missing payload data', [ 'status' => 400 ] );
        }

        if ( self::is_duplicate_event( 'crypto', $event_id ) ) {
            return rest_ensure_response( [ 'success' => true, 'message' => 'Duplicate event ignored.' ] );
        }

        if ( $payload_type === 'deposit.paid' ) {
            $result = self::verify_wallet_deposit( $reference_id, $amount, $currency );
            if ( is_wp_error( $result ) ) return $result;
        } elseif ( $payload_type === 'order.paid' ) {
            $result = self::verify_order_payment( $reference_id, $amount, $currency );
            if ( is_wp_error( $result ) ) return $result;
        } else {
            return rest_ensure_response( [ 'success' => true, 'message' => 'Event type ignored.' ] );
        }

        return rest_ensure_response( [ 'success' => true ] );
    }

    public static function verify_order_payment( $order_id, $expected_amount = null, $expected_currency = null ) {
        global $wpdb;
        $order_id = absint( $order_id );

        $wpdb->query( 'START TRANSACTION' );

        $order = $wpdb->get_row( $wpdb->prepare( "SELECT id, user_id, payment_status, total FROM {$wpdb->prefix}adm_orders WHERE id = %d FOR UPDATE", $order_id ) );
        
        if ( ! $order ) {
            $wpdb->query( 'ROLLBACK' );
            return new WP_Error( 'not_found', 'Order not found.', [ 'status' => 404 ] );
        }

        if ( $order->payment_status === 'PAID' ) {
            $wpdb->query( 'ROLLBACK' );
            return true; // Idempotent
        }

        if ( $order->payment_status !== 'PAYMENT_REVIEW' && $order->payment_status !== 'PENDING' ) {
            $wpdb->query( 'ROLLBACK' );
            return new WP_Error( 'invalid_state', 'Order state invalid for payment.', [ 'status' => 400 ] );
        }

        // Amount & Currency Validation
        if ( $expected_amount !== null && (float) $order->total !== (float) $expected_amount ) {
            $wpdb->query( 'ROLLBACK' );
            return new WP_Error( 'amount_mismatch', 'Payment amount does not match order total.', [ 'status' => 400 ] );
        }
        if ( $expected_currency !== null && strtoupper( $expected_currency ) !== 'USD' ) {
            $wpdb->query( 'ROLLBACK' );
            return new WP_Error( 'currency_mismatch', 'Invalid currency.', [ 'status' => 400 ] );
        }

        // Fetch Order Items and grant licenses
        $items = $wpdb->get_results( $wpdb->prepare( "SELECT product_id FROM {$wpdb->prefix}adm_order_items WHERE order_id = %d", $order_id ) );
        
        foreach ( $items as $item ) {
            $wpdb->replace( "{$wpdb->prefix}adm_licenses", [
                'user_id' => $order->user_id,
                'order_id' => $order_id,
                'product_id' => $item->product_id,
                'status' => 'ACTIVE'
            ]);
        }

        $wpdb->update( "{$wpdb->prefix}adm_orders", [ 'payment_status' => 'PAID', 'order_status' => 'PROCESSING' ], [ 'id' => $order_id ] );
        
        // Trigger Referral Commission (if applicable)
        if ( class_exists( 'ADM_Referrals' ) ) {
            ADM_Referrals::process_order_commission( $order_id, $order->total, $order->user_id );
        }

        $wpdb->query( 'COMMIT' );
        return true;
    }

    public static function verify_wallet_deposit( $deposit_id, $expected_amount = null, $expected_currency = null ) {
        global $wpdb;
        $deposit_id = absint( $deposit_id );

        $wpdb->query( 'START TRANSACTION' );

        $deposit = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}adm_wallet_deposits WHERE id = %d FOR UPDATE", $deposit_id ) );
        
        if ( ! $deposit ) {
            $wpdb->query( 'ROLLBACK' );
            return new WP_Error( 'not_found', 'Deposit not found.', [ 'status' => 404 ] );
        }

        if ( $deposit->status === 'COMPLETED' ) {
            $wpdb->query( 'ROLLBACK' );
            return true; 
        }

        if ( $deposit->status !== 'PENDING' && $deposit->status !== 'PAYMENT_REVIEW' ) {
            $wpdb->query( 'ROLLBACK' );
            return new WP_Error( 'invalid_state', 'Deposit invalid state.', [ 'status' => 400 ] );
        }

        // Validate Amount & Currency
        if ( $expected_amount !== null && (float) $deposit->amount_usd !== (float) $expected_amount ) {
            $wpdb->query( 'ROLLBACK' );
            return new WP_Error( 'amount_mismatch', 'Deposit amount mismatch.', [ 'status' => 400 ] );
        }
        if ( $expected_currency !== null && strtoupper( $expected_currency ) !== 'USD' ) {
            $wpdb->query( 'ROLLBACK' );
            return new WP_Error( 'currency_mismatch', 'Invalid currency.', [ 'status' => 400 ] );
        }

        $wallet_id = $deposit->wallet_id;
        $wpdb->query( $wpdb->prepare( "SELECT id FROM {$wpdb->prefix}adm_wallets WHERE id = %d FOR UPDATE", $wallet_id ) );

        $wpdb->update( "{$wpdb->prefix}adm_wallet_deposits", [ 'status' => 'COMPLETED' ], [ 'id' => $deposit_id ] );

        $wpdb->insert( "{$wpdb->prefix}adm_wallet_transactions", [
            'wallet_id' => $wallet_id,
            'type' => 'DEPOSIT',
            'cash_amount' => $deposit->amount_usd,
            'bonus_amount' => $deposit->bonus_amount_usd,
            'idempotency_key' => 'dep_' . $deposit_id,
            'reference_type' => 'DEPOSIT',
            'reference_id' => $deposit_id
        ]);

        $wpdb->query( 'COMMIT' );
        return true;
    }

    public function admin_manual_verification( WP_REST_Request $request ) {
        $type = sanitize_text_field( $request->get_param( 'type' ) ); 
        $reference_id = absint( $request->get_param( 'reference_id' ) );
        
        if ( $type === 'deposit' ) {
            // Manual overrides don't check amount, admin has already visually verified proof.
            $res = self::verify_wallet_deposit( $reference_id );
        } else {
            $res = self::verify_order_payment( $reference_id );
        }

        if ( is_wp_error( $res ) ) return $res;
        return rest_ensure_response( [ 'success' => true ] );
    }
}
