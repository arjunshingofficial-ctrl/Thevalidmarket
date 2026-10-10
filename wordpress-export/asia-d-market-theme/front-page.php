<?php get_header(); ?>

<div class="relative overflow-hidden bg-background pt-16 md:pt-24 lg:pt-32 pb-16">
    <div class="container max-w-[1440px] mx-auto px-4 md:px-6 relative z-10">
        <div class="max-w-3xl mx-auto text-center">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-8 border border-primary/20">
                <span class="relative flex h-2 w-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span class="text-sm font-medium">Asia D Market Core v1.0 Active</span>
            </div>
            
            <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-8">
                Welcome to <span class="text-primary">Asia D Market</span>
            </h1>
            
            <p class="text-xl md:text-2xl text-muted-foreground mb-12">
                Your premium marketplace for digital products, VPNs, proxies, and advanced tools. Now fully powered by WordPress.
            </p>
            
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="/shop" class="w-full sm:w-auto px-8 py-4 bg-primary text-background font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    <i data-lucide="shopping-bag" class="w-5 h-5"></i>
                    Browse Products
                </a>
                <a href="/dashboard" class="w-full sm:w-auto px-8 py-4 bg-card border border-border text-foreground font-bold rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2">
                    <i data-lucide="layout-dashboard" class="w-5 h-5"></i>
                    Go to Dashboard
                </a>
            </div>
        </div>
    </div>
</div>

<div class="container max-w-[1440px] mx-auto px-4 md:px-6 py-16">
    <h2 class="text-3xl font-bold mb-8 text-foreground text-center">Recent Products</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <?php
        $products = new WP_Query([
            'post_type' => 'adm_product',
            'posts_per_page' => 4,
            'post_status' => 'publish'
        ]);
        
        if ( $products->have_posts() ) :
            while ( $products->have_posts() ) : $products->the_post();
        ?>
            <div class="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors group">
                <div class="h-48 bg-muted flex items-center justify-center relative overflow-hidden">
                    <i data-lucide="box" class="w-12 h-12 text-muted-foreground group-hover:scale-110 transition-transform"></i>
                </div>
                <div class="p-6">
                    <h3 class="font-bold text-lg text-foreground mb-2"><?php the_title(); ?></h3>
                    <div class="flex items-center justify-between mt-4">
                        <span class="text-primary font-bold">View Details</span>
                        <a href="<?php the_permalink(); ?>" class="text-sm bg-muted text-foreground px-3 py-1 rounded hover:bg-primary hover:text-background transition-colors">Details</a>
                    </div>
                </div>
            </div>
        <?php
            endwhile;
            wp_reset_postdata();
        else :
        ?>
            <div class="col-span-full text-center py-12 bg-card border border-border rounded-xl">
                <i data-lucide="package-open" class="w-12 h-12 text-muted-foreground mx-auto mb-4"></i>
                <h3 class="text-lg font-medium text-foreground">No products found</h3>
                <p class="text-muted-foreground">Check back soon for new arrivals.</p>
            </div>
        <?php endif; ?>
    </div>
</div>

<?php get_footer(); ?>
