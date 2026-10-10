<?php
/**
 * ADM Storage and Digital Entitlements
 */
class ADM_Storage {
    public function __construct() {
        add_action( 'rest_api_init', [ $this, 'register_routes' ] );
    }

    public function register_routes() {
        register_rest_route( 'adm/v1', '/downloads/request', [
            'methods' => 'POST',
            'callback' => [ $this, 'request_download' ],
            'permission_callback' => 'is_user_logged_in'
        ]);
    }

    /**
     * Entitlement verification
     */
    public static function has_entitlement( $user_id, $product_id ) {
        global $wpdb;
        $product_id = absint( $product_id );
        $user_id = absint( $user_id );

        // Check if a valid, active license exists for this user and product
        $license = $wpdb->get_row( $wpdb->prepare( "
            SELECT id, order_id 
            FROM {$wpdb->prefix}adm_licenses 
            WHERE user_id = %d AND product_id = %d AND status = 'ACTIVE'
        ", $user_id, $product_id ) );

        if ( ! $license ) return false;

        // Verify the underlying order is actually paid and not refunded/failed
        $order_status = $wpdb->get_var( $wpdb->prepare( "
            SELECT payment_status 
            FROM {$wpdb->prefix}adm_orders 
            WHERE id = %d
        ", $license->order_id ) );

        return ( $order_status === 'PAID' );
    }

    /**
     * Mocks a signed URL generation.
     * In production, this would use AWS SDK (S3Client->createPresignedRequest)
     */
    private static function generate_signed_url( $object_path ) {
        // Prevent path traversal
        if ( strpos( $object_path, '..' ) !== false || strpos( $object_path, './' ) !== false ) {
            return new WP_Error( 'invalid_path', 'Path traversal attempt detected.', [ 'status' => 403 ] );
        }

        // Mock integration since no AWS SDK or Supabase keys are provided
        if ( defined( 'ADM_TESTING_HARNESS_ACTIVE' ) && ADM_TESTING_HARNESS_ACTIVE ) {
            return "https://mock-storage.local/download?path=" . urlencode( $object_path ) . "&sig=test-sig-123&expires=" . ( time() + 300 );
        }

        return new WP_Error( 'not_implemented', 'Storage adapter not configured.', [ 'status' => 501 ] );
    }

    public function request_download( WP_REST_Request $request ) {
        $user_id = get_current_user_id();
        $product_id = absint( $request->get_param( 'product_id' ) );
        
        if ( ! $product_id ) {
            return new WP_Error( 'bad_request', 'Product ID required.', [ 'status' => 400 ] );
        }

        if ( ! self::has_entitlement( $user_id, $product_id ) ) {
            return new WP_Error( 'unauthorized', 'You do not own an active license for this product.', [ 'status' => 403 ] );
        }

        // Fetch the secure internal object path from product metadata
        $object_path = get_post_meta( $product_id, 'adm_s3_object_path', true );
        
        if ( empty( $object_path ) ) {
            return new WP_Error( 'missing_file', 'No file is currently attached to this product.', [ 'status' => 404 ] );
        }

        $url_result = self::generate_signed_url( $object_path );
        
        if ( is_wp_error( $url_result ) ) {
            return $url_result;
        }

        return rest_ensure_response([
            'success' => true,
            'download_url' => $url_result,
            'expires_in' => 300 // 5 minutes
        ]);
    }
}
