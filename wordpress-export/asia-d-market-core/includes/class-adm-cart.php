<?php
class ADM_Cart {
    public function __construct() {
        add_action( 'rest_api_init', [ $this, 'register_routes' ] );
        add_action( 'init', [ $this, 'init_session' ] );
    }

    public function init_session() {
        if ( ! is_admin() && ! isset( $_COOKIE['adm_session'] ) ) {
            $token = bin2hex( random_bytes( 32 ) );
            setcookie( 'adm_session', $token, time() + ( 86400 * 30 ), COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true );
            $_COOKIE['adm_session'] = $token;
        }
    }

    private static function get_session_token() {
        return isset( $_COOKIE['adm_session'] ) ? sanitize_text_field( $_COOKIE['adm_session'] ) : '';
    }

    public static function get_cart_data() {
        global $wpdb;
        $token = self::get_session_token();
        if ( ! $token ) return [];
        $row = $wpdb->get_row( $wpdb->prepare( "SELECT session_data FROM {$wpdb->prefix}adm_sessions WHERE session_key = %s", wp_hash( $token ) ) );
        return $row ? json_decode( $row->session_data, true ) : [];
    }

    private static function save_cart_data( $data ) {
        global $wpdb;
        $token = self::get_session_token();
        if ( ! $token ) return false;
        
        $key = wp_hash( $token );
        $user_id = is_user_logged_in() ? get_current_user_id() : null;
        $expiry = time() + ( 86400 * 30 );
        $json = json_encode( $data );

        $wpdb->replace( "{$wpdb->prefix}adm_sessions", [
            'session_key' => $key,
            'user_id' => $user_id,
            'session_data' => $json,
            'session_expiry' => $expiry
        ], [ '%s', '%d', '%s', '%d' ] );

        return true;
    }

    public function register_routes() {
        register_rest_route( 'adm/v1', '/cart/add', [
            'methods' => 'POST',
            'callback' => [ $this, 'add_to_cart' ],
            'permission_callback' => '__return_true'
        ]);
    }

    public function add_to_cart( WP_REST_Request $request ) {
        $product_id = absint( $request->get_param( 'product_id' ) );
        $quantity = absint( $request->get_param( 'quantity' ) );
        
        if ( $quantity < 1 || $quantity > 100 ) {
            return new WP_Error( 'invalid_quantity', 'Quantity must be between 1 and 100.', [ 'status' => 400 ] );
        }

        if ( ! $product_id || get_post_type( $product_id ) !== 'adm_product' || get_post_status( $product_id ) !== 'publish' ) {
            return new WP_Error( 'invalid_product', 'Invalid or unavailable product.', [ 'status' => 400 ] );
        }

        $cart = self::get_cart_data();
        
        if ( isset( $cart[ $product_id ] ) ) {
            $cart[ $product_id ] += $quantity;
            if ( $cart[ $product_id ] > 100 ) $cart[ $product_id ] = 100;
        } else {
            $cart[ $product_id ] = $quantity;
        }

        self::save_cart_data( $cart );
        
        return rest_ensure_response([
            'success' => true,
            'message' => 'Product added to cart'
        ]);
    }
}
