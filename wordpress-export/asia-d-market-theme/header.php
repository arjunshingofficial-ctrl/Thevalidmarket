<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
    <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body <?php body_class('bg-background text-foreground'); ?>>
    <header class="sticky top-0 z-50 w-full transition-all duration-300 bg-card border-b border-border py-3">
        <div class="container max-w-[1440px] mx-auto flex items-center justify-between px-4 md:px-6 lg:px-8">
            
            <!-- Left: Brand -->
            <div class="flex items-center gap-8">
                <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="flex items-center gap-2 group z-10">
                    <div class="w-8 h-8 bg-primary text-background rounded-lg flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
                        A
                    </div>
                    <span class="text-xl font-extrabold tracking-tight text-foreground group-hover:text-primary transition-colors hidden sm:block">
                        Asia D Market
                    </span>
                </a>
            </div>

            <!-- Right: Account -->
            <div class="flex items-center gap-4 lg:gap-6 z-10">
                <?php if ( is_user_logged_in() ) : ?>
                    <a href="/dashboard" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <i data-lucide="user" class="w-5 h-5 text-primary"></i>
                        <span class="text-sm font-medium">Dashboard</span>
                    </a>
                <?php else : ?>
                    <div class="flex items-center gap-3">
                        <a href="<?php echo esc_url( wp_login_url() ); ?>" class="text-sm font-medium text-foreground hover:text-primary transition-colors">
                            Login
                        </a>
                        <a href="<?php echo esc_url( wp_registration_url() ); ?>" class="text-sm font-medium bg-primary text-background px-4 py-2 rounded-full hover:bg-primary/90 transition-colors shadow-sm">
                            Sign Up
                        </a>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </header>
    
    <main class="min-h-screen">
