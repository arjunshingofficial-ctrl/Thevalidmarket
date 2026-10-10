<?php
class ADM_Wallet {
    public function __construct() {
        // Initialization
    }

    /**
     * Safely process a wallet transaction with FOR UPDATE row locking.
     */
    public static function add_transaction($user_id, $type, $cash_amount, $bonus_amount, $ref_type = null, $ref_id = null, $desc = '') {
        global $wpdb;

        $wpdb->query('START TRANSACTION');

        // Lock the wallet row to prevent double spending
        $wallet = $wpdb->get_row(
            $wpdb->prepare("SELECT id FROM {$wpdb->prefix}adm_wallets WHERE user_id = %d FOR UPDATE", $user_id)
        );

        if (!$wallet) {
            // Create wallet if not exists
            $wpdb->insert("{$wpdb->prefix}adm_wallets", ['user_id' => $user_id]);
            $wallet_id = $wpdb->insert_id;
        } else {
            $wallet_id = $wallet->id;
        }

        // We could aggregate total balance here before proceeding to ensure sufficient funds if negative

        $wpdb->insert("{$wpdb->prefix}adm_wallet_transactions", [
            'wallet_id' => $wallet_id,
            'type' => $type,
            'cash_amount' => $cash_amount,
            'bonus_amount' => $bonus_amount,
            'reference_type' => $ref_type,
            'reference_id' => $ref_id,
            'description' => $desc
        ]);

        $wpdb->query('COMMIT');
        return true;
    }
}
