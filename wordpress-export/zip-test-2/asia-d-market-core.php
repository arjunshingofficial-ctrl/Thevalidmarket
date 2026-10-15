<?php
/**
 * Plugin Name: The Valid Market Core
 * Plugin URI:  https://www.thevalidmarket.com
 * Description: Bespoke e-commerce engine for The Valid Market. Handles wallets, orders, licensing, and P2P transfers.
 * Version:     1.0.0
 * Author:      The Valid Market
 * Text Domain: asia-d-market
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

define( 'ADM_CORE_VERSION', '1.0.0' );
define( 'ADM_CORE_DIR', plugin_dir_path( __FILE__ ) );

// Includes
require_once ADM_CORE_DIR . 'includes/class-adm-installer.php';
require_once ADM_CORE_DIR . 'includes/class-adm-post-types.php';
require_once ADM_CORE_DIR . 'includes/class-adm-wallet.php';
require_once ADM_CORE_DIR . 'includes/class-adm-rest-api.php';
require_once ADM_CORE_DIR . 'includes/class-adm-auth.php';
require_once ADM_CORE_DIR . 'includes/class-adm-products.php';
require_once ADM_CORE_DIR . 'includes/class-adm-cart.php';
require_once ADM_CORE_DIR . 'includes/class-adm-orders.php';
require_once ADM_CORE_DIR . 'includes/class-adm-payments.php';
require_once ADM_CORE_DIR . 'includes/class-adm-storage.php';
require_once ADM_CORE_DIR . 'includes/class-adm-referrals.php';

// Hooks
register_activation_hook( __FILE__, [ 'ADM_Installer', 'activate' ] );
add_action( 'init', [ 'ADM_Post_Types', 'register' ] );
add_action( 'rest_api_init', [ 'ADM_REST_API', 'register_routes' ] );

// Initialize components
new ADM_Wallet();
new ADM_Auth();
new ADM_Products();
new ADM_Cart();
new ADM_Orders();
new ADM_Payments();
new ADM_Storage();
new ADM_Referrals();
