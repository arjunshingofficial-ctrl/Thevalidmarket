# SEO.md - SEO Architecture

## Dynamic Metadata
Next.js `generateMetadata` will be used extensively for:
- **Products:** SEO title, dynamic descriptions based on category/price, OG images.
- **Categories:** Optimized titles and descriptions.
- **Blog:** Full article metadata.

## Structured Data (JSON-LD)
- **Product Schema:** Added to all product pages (Price, Rating, Availability).
- **Breadcrumb Schema:** For store navigation.
- **Article Schema:** For blog posts.
- **FAQ Schema:** For category and product FAQs.

## Technical SEO
- **Sitemap:** Automatically generated `sitemap.xml` referencing products, categories, blog posts, and static pages.
- **Robots.txt:** Configured to allow crawling of public pages while blocking `/dashboard`, `/admin`, `/checkout`, and `/api`.
- **Canonical URLs:** Strict enforcement to prevent duplicate content issues.
- **Performance:** Core Web Vitals optimized via Next.js image optimization, caching, and font loading.
