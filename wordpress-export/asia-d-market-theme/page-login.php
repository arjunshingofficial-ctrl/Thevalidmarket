<?php
/* Template Name: Login Page */
get_header(); ?>
<div class="adm-login-container">
    <div class="adm-login-box">
        <h1>Login</h1>
        <?php
        if ( ! is_user_logged_in() ) {
            $args = array(
                'echo'           => true,
                'remember'       => true,
                'value_remember' => true,
            );
            wp_login_form( $args );
        } else {
            echo '<p>You are already logged in. <a href="/dashboard">Go to Dashboard</a></p>';
        }
        ?>
    </div>
</div>
<?php get_footer(); ?>
