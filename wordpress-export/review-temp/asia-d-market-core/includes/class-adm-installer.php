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
            created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY  (id),
            KEY wallet_id (wallet_id)
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
            created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY  (id),
            KEY user_id (user_id)
        ) $charset_collate;
        ";

        require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
        dbDelta( $sql );
    }

    private static function add_roles() {
        add_role( 'adm_customer', 'Customer', [ 'read' => true ] );
    }
}
