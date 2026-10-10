<?php
get_header(); ?>
<div class="adm-single-product">
    <?php if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>
        <div class="adm-product-layout">
            <div class="adm-product-image">
                <?php if ( has_post_thumbnail() ) : ?>
                    <?php the_post_thumbnail( 'large' ); ?>
                <?php endif; ?>
            </div>
            <div class="adm-product-details">
                <h1><?php the_title(); ?></h1>
                <p class="adm-price"><?php echo esc_html( get_post_meta( get_the_ID(), 'price', true ) ); ?></p>
                <div class="adm-description">
                    <?php the_content(); ?>
                </div>
                <form class="adm-add-to-cart-form" method="POST" action="<?php echo esc_url( rest_url('adm/v1/cart/add') ); ?>">
                    <input type="hidden" name="product_id" value="<?php echo get_the_ID(); ?>">
                    <button type="submit" class="adm-btn">Add to Cart</button>
                </form>
            </div>
        </div>
    <?php endwhile; endif; ?>
</div>
<?php get_footer(); ?>
