<?php
class ADM_Referrals {
    const COMMISSION_RATE = 0.30; // 30% default commission

    public function __construct() {
        add_action( 'rest_api_init', [ $this, 'register_routes' ] );
    }

    public function register_routes() {
        register_rest_route( 'adm/v1', '/referrals/stats', [
            'methods' => 'GET',
            'callback' => [ $this, 'get_referral_stats' ],
            'permission_callback' => 'is_user_logged_in'
        ]);
        
        // Mock Endpoint for registering a user with a referral code (since this isn't a full WP auth overhaul yet)
        register_rest_route( 'adm/v1', '/referrals/bind', [
            'methods' => 'POST',
            'callback' => [ $this, 'bind_referral' ],
            'permission_callback' => 'is_user_logged_in'
        ]);
    }

    /**
     * Binds a referred user to a referrer
     */
    public function bind_referral( WP_REST_Request $request ) {
        global $wpdb;
        $referred_id = get_current_user_id();
        $referrer_id = absint( $request->get_param( 'referrer_id' ) );
        
        if ( ! $referrer_id || $referrer_id === $referred_id ) {
            return new WP_Error( 'invalid_referral', 'Invalid referral code or self-referral.', [ 'status' => 400 ] );
        }

        $inserted = $wpdb->insert( "{$wpdb->prefix}adm_referrals", [
            'referrer_id' => $referrer_id,
            'referred_user_id' => $referred_id
        ]);

        if ( ! $inserted ) {
            return new WP_Error( 'duplicate_referral', 'User is already referred.', [ 'status' => 400 ] );
        }

        return rest_ensure_response( [ 'success' => true ] );
    }

    /**
     * Calculates and records a commission for a newly paid order
     */
    public static function process_order_commission( $order_id, $order_total, $buyer_id ) {
        global $wpdb;
        $order_id = absint( $order_id );
        $buyer_id = absint( $buyer_id );
        $order_total = (float) $order_total;

        // Check if buyer was referred
        $referrer_id = $wpdb->get_var( $wpdb->prepare( "SELECT referrer_id FROM {$wpdb->prefix}adm_referrals WHERE referred_user_id = %d", $buyer_id ) );
        
        if ( ! $referrer_id ) return false; // No commission to pay

        $commission_amount = round( $order_total * self::COMMISSION_RATE, 2 );
        if ( $commission_amount <= 0 ) return false;

        // Ensure order hasn't already paid a commission (Idempotency)
        $existing = $wpdb->get_var( $wpdb->prepare( "SELECT id FROM {$wpdb->prefix}adm_commissions WHERE order_id = %d", $order_id ) );
        if ( $existing ) return false;

        // Create Pending Commission Record (Requires admin approval to release to wallet)
        $wpdb->insert( "{$wpdb->prefix}adm_commissions", [
            'referrer_id' => $referrer_id,
            'referred_user_id' => $buyer_id,
            'order_id' => $order_id,
            'amount' => $commission_amount,
            'status' => 'PENDING'
        ]);

        return true;
    }

    /**
     * Payout a commission (Admin action)
     * Credits the referrer's wallet safely using existing wallet engine constraints.
     */
    public static function payout_commission( $commission_id ) {
        global $wpdb;
        $commission_id = absint( $commission_id );

        $wpdb->query( 'START TRANSACTION' );
        
        $commission = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}adm_commissions WHERE id = %d FOR UPDATE", $commission_id ) );
        
        if ( ! $commission || $commission->status !== 'PENDING' ) {
            $wpdb->query( 'ROLLBACK' );
            return new WP_Error( 'invalid_commission', 'Commission is not eligible for payout.', [ 'status' => 400 ] );
        }

        // Use Wallet Engine to add funds atomically
        $wallet_id = ADM_Wallet::get_wallet_id( $commission->referrer_id, true );

        $wpdb->update( "{$wpdb->prefix}adm_commissions", [ 'status' => 'PAID' ], [ 'id' => $commission_id ] );

        $wpdb->insert( "{$wpdb->prefix}adm_wallet_transactions", [
            'wallet_id' => $wallet_id,
            'type' => 'COMMISSION',
            'cash_amount' => $commission->amount,
            'bonus_amount' => 0,
            'idempotency_key' => 'comm_' . $commission_id,
            'reference_type' => 'COMMISSION',
            'reference_id' => $commission_id
        ]);

        $wpdb->query( 'COMMIT' );
        return true;
    }

    /**
     * API for user to view their stats
     */
    public function get_referral_stats() {
        global $wpdb;
        $user_id = get_current_user_id();

        $stats = $wpdb->get_row( $wpdb->prepare( "
            SELECT 
                COUNT(id) as total_referrals,
                SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END) as total_earned,
                SUM(CASE WHEN status = 'PENDING' THEN amount ELSE 0 END) as total_pending
            FROM {$wpdb->prefix}adm_commissions
            WHERE referrer_id = %d
        ", $user_id ) );

        return rest_ensure_response([
            'total_referrals' => (int) $stats->total_referrals,
            'total_earned' => (float) $stats->total_earned,
            'total_pending' => (float) $stats->total_pending
        ]);
    }
}
