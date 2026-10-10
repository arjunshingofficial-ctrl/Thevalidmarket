<?php
function adm_theme_enqueue_scripts() {
    wp_enqueue_style( 'adm-theme-style', get_stylesheet_uri() );
    wp_enqueue_script( 'adm-theme-script', get_template_directory_uri() . '/assets/js/main.js', array('jquery'), '1.0.0', true );
}
add_action( 'wp_enqueue_scripts', 'adm_theme_enqueue_scripts' );

function adm_theme_setup() {
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    register_nav_menus( array(
        'primary' => __( 'Primary Menu', 'adm-theme' ),
        'footer'  => __( 'Footer Menu', 'adm-theme' ),
    ) );
}
add_action( 'after_setup_theme', 'adm_theme_setup' );
