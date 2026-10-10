<?php
class ADM_Auth {
    public function __construct() {
        add_filter( 'check_password', [ $this, 'migrate_bcrypt_password' ], 10, 4 );
        add_filter( 'login_redirect', [ $this, 'custom_login_redirect' ], 10, 3 );
    }

    /**
     * Migrate bcrypt hashes to native WordPress hashes on first login.
     * Next.js generally uses bcrypt (starts with $2y$ or $2a$).
     */
    public function migrate_bcrypt_password( $check, $password, $hash, $user_id ) {
        if ( ! $check ) {
            // If WP standard check failed, check if it's a bcrypt hash
            if ( strpos( $hash, '$2' ) === 0 ) {
                if ( password_verify( $password, $hash ) ) {
                    // Password matches legacy bcrypt!
                    $check = true;
                    // Rehash to WP standard
                    wp_set_password( $password, $user_id );
                }
            }
        }
        return $check;
    }

    /**
     * Redirect users to dashboard after login, admins to backend.
     */
    public function custom_login_redirect( $redirect_to, $request, $user ) {
        if ( isset( $user->roles ) && is_array( $user->roles ) ) {
            if ( in_array( 'administrator', $user->roles ) ) {
                return admin_url();
            } else {
                return home_url( '/dashboard' );
            }
        }
        return home_url();
    }
}
