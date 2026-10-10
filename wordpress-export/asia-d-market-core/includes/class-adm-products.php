<?php
class ADM_Products {
    public function __construct() {
        add_action( 'add_meta_boxes', [ $this, 'add_price_meta_box' ] );
        add_action( 'save_post_adm_product', [ $this, 'save_product_meta' ] );
    }

    public function add_price_meta_box() {
        add_meta_box(
            'adm_product_price_box',
            'Product Pricing & Configuration',
            [ $this, 'render_price_meta_box' ],
            'adm_product',
            'side',
            'default'
        );
    }

    public function render_price_meta_box( $post ) {
        wp_nonce_field( 'adm_save_product_data', 'adm_product_meta_nonce' );
        
        $price = get_post_meta( $post->ID, 'adm_price', true );
        $discount = get_post_meta( $post->ID, 'adm_discount', true );
        ?>
        <p>
            <label for="adm_price"><strong>Price (USD)</strong></label><br>
            <input type="number" step="0.01" id="adm_price" name="adm_price" value="<?php echo esc_attr( $price ); ?>" style="width:100%;" />
        </p>
        <p>
            <label for="adm_discount"><strong>Discount (%)</strong></label><br>
            <input type="number" step="1" id="adm_discount" name="adm_discount" value="<?php echo esc_attr( $discount ); ?>" style="width:100%;" />
        </p>
        <?php
    }

    public function save_product_meta( $post_id ) {
        if ( ! isset( $_POST['adm_product_meta_nonce'] ) || ! wp_verify_nonce( $_POST['adm_product_meta_nonce'], 'adm_save_product_data' ) ) {
            return;
        }

        if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
            return;
        }

        if ( ! current_user_can( 'edit_post', $post_id ) ) {
            return;
        }

        if ( isset( $_POST['adm_price'] ) ) {
            update_post_meta( $post_id, 'adm_price', sanitize_text_field( $_POST['adm_price'] ) );
        }
        
        if ( isset( $_POST['adm_discount'] ) ) {
            update_post_meta( $post_id, 'adm_discount', sanitize_text_field( $_POST['adm_discount'] ) );
        }
    }

    /**
     * Authoritative server-side price calculation.
     * NEVER trust client-submitted prices for orders.
     */
    public static function get_calculated_price( $product_id ) {
        $price = (float) get_post_meta( $product_id, 'adm_price', true );
        $discount = (float) get_post_meta( $product_id, 'adm_discount', true );

        if ( $discount > 0 && $discount <= 100 ) {
            $price = $price - ( $price * ( $discount / 100 ) );
        }

        return max( 0, $price ); // Prevent negative prices
    }
}
