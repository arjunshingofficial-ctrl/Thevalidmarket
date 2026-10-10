<?php
class ADM_Orders {
    public function __construct() {
        add_action( 'rest_api_init', [ $this, 'register_routes' ] );
    }

    public function register_routes() {
        register_rest_route( 'adm/v1', '/checkout/process', [
            'methods' => 'POST',
            'callback' => [ $this, 'process_checkout' ],
            'permission_callback' => function () {
                return is_user_logged_in(); // Must be logged in to order
            }
        ]);
    }

    public function process_checkout( WP_REST_Request $request ) {
        global $wpdb;
        $user_id = get_current_user_id();
        
        // 1. Enforce Idempotency Key
        $idempotency_key = sanitize_text_field( $request->get_header( 'Idempotency-Key' ) );
        if ( empty( $idempotency_key ) || strlen( $idempotency_key ) > 64 ) {
            return new WP_Error( 'missing_idempotency', 'A valid Idempotency-Key header is required.', [ 'status' => 400 ] );
        }

        // Check if order already exists for this token and user
        $existing = $wpdb->get_row( $wpdb->prepare( "SELECT id, payment_status FROM {$wpdb->prefix}adm_orders WHERE user_id = %d AND idempotency_key = %s", $user_id, $idempotency_key ) );
        if ( $existing ) {
            return rest_ensure_response([
                'success' => true,
                'order_id' => $existing->id,
                'status' => $existing->payment_status,
                'message' => 'Order already processed.'
            ]);
        }
        
        // 2. Fetch Server-Side Cart (IGNORE Client Payload)
        $cart_items = ADM_Cart::get_cart_data();
        if ( empty( $cart_items ) ) {
            return new WP_Error( 'empty_cart', 'Cannot checkout with an empty cart.', [ 'status' => 400 ] );
        }

        $wpdb->query('START TRANSACTION');

        try {
            $total = 0;
            $items_to_insert = [];

            foreach ( $cart_items as $pid => $qty ) {
                $pid = absint( $pid );
                $qty = absint( $qty );
                
                if ( $qty < 1 || $qty > 100 ) {
                    throw new Exception('Invalid item quantity.');
                }
                
                if ( get_post_type( $pid ) !== 'adm_product' || get_post_status( $pid ) !== 'publish' ) {
                    throw new Exception('Product unavailable.');
                }

                // Authoritative recalculation
                $price = ADM_Products::get_calculated_price( $pid );
                $sub = $price * $qty;
                $total += $sub;

                $items_to_insert[] = [
                    'product_id' => $pid,
                    'quantity' => $qty,
                    'price_snapshot' => $price,
                    'subtotal' => $sub
                ];
            }

            // Create Order
            $order_inserted = $wpdb->insert( "{$wpdb->prefix}adm_orders", [
                'user_id' => $user_id,
                'subtotal' => $total,
                'total' => $total,
                'payment_status' => 'PAYMENT_REVIEW', // Initial status enforced
                'order_status' => 'PENDING',
                'idempotency_key' => $idempotency_key
            ]);
            
            if ( ! $order_inserted ) {
                throw new Exception('Failed to create order record. Idempotency conflict or database error.');
            }
            
            $order_id = $wpdb->insert_id;

            // Insert Items
            foreach ( $items_to_insert as $i ) {
                $i['order_id'] = $order_id;
                $item_inserted = $wpdb->insert( "{$wpdb->prefix}adm_order_items", $i );
                if ( ! $item_inserted ) {
                    throw new Exception('Failed to create order items.');
                }
            }

            $wpdb->query('COMMIT');

            return rest_ensure_response([
                'success' => true,
                'order_id' => $order_id,
                'status' => 'PAYMENT_REVIEW'
            ]);

        } catch (Exception $e) {
            $wpdb->query('ROLLBACK');
            return new WP_Error( 'checkout_failed', $e->getMessage(), [ 'status' => 500 ] );
        }
    }
}
