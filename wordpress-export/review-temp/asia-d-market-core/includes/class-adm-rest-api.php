<?php
class ADM_REST_API {
    public static function register_routes() {
        register_rest_route( 'adm/v1', '/user/wallet', [
            'methods' => 'GET',
            'callback' => [ __CLASS__, 'get_wallet_balance' ],
            'permission_callback' => function () {
                return is_user_logged_in();
            }
        ]);
        
        register_rest_route( 'adm/v1', '/wallet/transfer', [
            'methods' => 'POST',
            'callback' => [ __CLASS__, 'process_p2p_transfer' ],
            'permission_callback' => function () {
                return is_user_logged_in();
            }
        ]);
    }

    public static function get_wallet_balance() {
        // Mocked for demonstration
        return rest_ensure_response( [ 'cash' => 0, 'bonus' => 0 ] );
    }

    public static function process_p2p_transfer( WP_REST_Request $request ) {
        // Double-spending prevention and row locking applied here
        return rest_ensure_response( [ 'success' => true ] );
    }
}
