<?php
class ADM_Post_Types {
    public static function register() {
        register_post_type( 'adm_product', [
            'labels' => [
                'name' => 'Products',
                'singular_name' => 'Product'
            ],
            'public' => true,
            'has_archive' => true,
            'supports' => [ 'title', 'editor', 'thumbnail', 'custom-fields', 'comments' ],
            'menu_icon' => 'dashicons-cart',
            'show_in_rest' => true,
        ] );

        register_post_type( 'adm_course', [
            'labels' => [
                'name' => 'Courses',
                'singular_name' => 'Course'
            ],
            'public' => true,
            'supports' => [ 'title', 'editor', 'thumbnail' ],
            'menu_icon' => 'dashicons-welcome-learn-more',
            'show_in_rest' => true,
        ] );
    }
}
