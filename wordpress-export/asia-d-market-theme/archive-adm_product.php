<?php
get_header(); ?>
<div class="adm-store">
    <h1>Store</h1>
    <div class="adm-grid">
        <?php if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>
            <div class="adm-product-card">
                <?php if ( has_post_thumbnail() ) : ?>
                    <a href="<?php the_permalink(); ?>"><?php the_post_thumbnail( 'medium' ); ?></a>
                <?php endif; ?>
                <h3><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
                <p><?php echo esc_html( get_post_meta( get_the_ID(), 'price', true ) ); ?></p>
            </div>
        <?php endwhile; else : ?>
            <p>No products found.</p>
        <?php endif; ?>
    </div>
    <div class="adm-pagination">
        <?php the_posts_pagination(); ?>
    </div>
</div>
<?php get_footer(); ?>
