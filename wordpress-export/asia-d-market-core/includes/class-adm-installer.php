<?php
class ADM_Installer {
    public static function activate() {
        self::create_tables();
        self::add_roles();
    }

    private static function create_tables() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "
        CREATE TABLE {$wpdb->prefix}adm_wallets (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            status varchar(20) DEFAULT 'ACTIVE' NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY user_id (user_id)
        ) $charset_collate;

        CREATE TABLE {$wpdb->prefix}adm_wallet_transactions (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            wallet_id bigint(20) NOT NULL,
            type varchar(50) NOT NULL,
            cash_amount decimal(15,2) DEFAULT '0.00' NOT NULL,
            bonus_amount decimal(15,2) DEFAULT '0.00' NOT NULL,
            reference_type varchar(50) DEFAULT NULL,
            reference_id varchar(100) DEFAULT NULL,
            description text,
            status varchar(20) DEFAULT 'COMPLETED' NOT NULL,
            idempotency_key varchar(64) DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY  (id),
            KEY wallet_id (wallet_id),
            UNIQUE KEY idempotency_key (idempotency_key)
        ) $charset_collate;

        CREATE TABLE {$wpdb->prefix}adm_wallet_deposits (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            wallet_id bigint(20) NOT NULL,
            amount_usd decimal(15,2) NOT NULL,
            bonus_amount_usd decimal(15,2) DEFAULT '0.00' NOT NULL,
            payment_method varchar(50) NOT NULL,
            status varchar(30) DEFAULT 'PENDING' NOT NULL,
            idempotency_key varchar(64) DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY  (id),
            KEY wallet_id (wallet_id),
            UNIQUE KEY idempotency_key (idempotency_key)
        ) $charset_collate;

        CREATE TABLE {$wpdb->prefix}adm_orders (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            subtotal decimal(15,2) NOT NULL,
            discount decimal(15,2) DEFAULT '0.00' NOT NULL,
            tax decimal(15,2) DEFAULT '0.00' NOT NULL,
            total decimal(15,2) NOT NULL,
            payment_status varchar(30) DEFAULT 'PENDING' NOT NULL,
            order_status varchar(30) DEFAULT 'PENDING' NOT NULL,
            idempotency_key varchar(64) DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            UNIQUE KEY idempotency_key (idempotency_key)
        ) $charset_collate;

        CREATE TABLE {$wpdb->prefix}adm_order_items (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            order_id bigint(20) NOT NULL,
            product_id bigint(20) NOT NULL,
            quantity int(11) NOT NULL DEFAULT '1',
            price_snapshot decimal(15,2) NOT NULL,
            subtotal decimal(15,2) NOT NULL,
            PRIMARY KEY  (id),
            KEY order_id (order_id)
        ) $charset_collate;

        CREATE TABLE {$wpdb->prefix}adm_sessions (
            session_key varchar(64) NOT NULL,
            user_id bigint(20) DEFAULT NULL,
            session_data longtext NOT NULL,
            session_expiry bigint(20) NOT NULL,
            PRIMARY KEY  (session_key),
            KEY user_id (user_id)
        ) $charset_collate;
        CREATE TABLE {$wpdb->prefix}adm_webhook_events (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            provider varchar(50) NOT NULL,
            event_id varchar(100) NOT NULL,
            status varchar(20) DEFAULT 'PROCESSED' NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY provider_event (provider, event_id)
        ) $charset_collate;

        CREATE TABLE {$wpdb->prefix}adm_licenses (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            order_id bigint(20) NOT NULL,
            product_id bigint(20) NOT NULL,
            license_key varchar(100) DEFAULT NULL,
            status varchar(30) DEFAULT 'ACTIVE' NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY order_id (order_id),
            UNIQUE KEY unique_user_product (user_id, product_id)
        ) $charset_collate;

        CREATE TABLE {$wpdb->prefix}adm_referrals (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            referrer_id bigint(20) NOT NULL,
            referred_user_id bigint(20) NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY  (id),
            KEY referrer_id (referrer_id),
            UNIQUE KEY unique_referred_user (referred_user_id)
        ) $charset_collate;

        CREATE TABLE {$wpdb->prefix}adm_commissions (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            referrer_id bigint(20) NOT NULL,
            referred_user_id bigint(20) NOT NULL,
            order_id bigint(20) NOT NULL,
            amount decimal(15,2) NOT NULL,
            status varchar(30) DEFAULT 'PENDING' NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY  (id),
            KEY referrer_id (referrer_id),
            UNIQUE KEY unique_order_commission (order_id)
        ) $charset_collate;
        ";

        require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
        dbDelta( $sql );
    }

    private static function add_roles() {
        add_role( 'adm_customer', 'Customer', [ 'read' => true ] );
    }
}
