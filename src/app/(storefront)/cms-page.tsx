import { 
  getHomepageConfig, getHomepageProducts, getMarketplaceStats, 
  getHomepageCategories, getHomepageReviews, getMarketplacePulse, 
  getRecentActivity, getCategoryProductSections, getHomepageBlogPosts, getFeaturedCourses
} from "@/lib/data/homepage";
import { HeroSection, StatsSection, CategoriesSection, WhyUsSection, HowItWorksSection, TrustSection, NewsletterSection, FinalCtaSection, ReviewListSection } from "@/components/home/HomeSections";
import { CategoryProductSection } from "@/components/home/CategoryProductSection";
import { BlogPostSection } from "@/components/home/BlogPostSection";
import ProductCard from "@/components/product/ProductCard";
import CourseCard from "@/components/product/CourseCard";
import Link from "next/link";
import { ArrowRight, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: { preview?: string } }) {
  const isPreview = searchParams.preview === "true";
  const config = await getHomepageConfig(isPreview);

  // Sort sections by order
  const activeSections = config.sections
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order);

  // Fetch all necessary data up front (concurrent, bounded)
  const [stats, pulse, categories, reviews, activities] = await Promise.all([
    getMarketplaceStats(),
    getMarketplacePulse(),
    getHomepageCategories(),
    getHomepageReviews(3),
    getRecentActivity(5),
  ]);

  // Pre-fetch all CategoryProducts sections in one batched call (avoids N+1)
  const categoryProductSections = activeSections.filter(s => s.type === "CategoryProducts");
  const categoryProductDataMap = categoryProductSections.length > 0
    ? await getCategoryProductSections(categoryProductSections)
    : {};

  // Pre-fetch all BlogPosts sections
  const blogSections = activeSections.filter(s => s.type === "BlogPosts");
  const blogDataMap: Record<string, any[]> = {};
  await Promise.all(
    blogSections.map(async (section) => {
      const { postCount, sort, categoryIds } = section.config;
      const take = postCount ? parseInt(String(postCount)) : 3;
      blogDataMap[section.id] = await getHomepageBlogPosts({ take, sort, categoryIds });
    })
  );

  // Pre-fetch all FeaturedCourses sections
  const featuredCoursesSections = activeSections.filter(s => s.type === "FeaturedCourses");
  const featuredCoursesMap: Record<string, any[]> = {};
  await Promise.all(
    featuredCoursesSections.map(async (section) => {
      featuredCoursesMap[section.id] = await getFeaturedCourses(section);
    })
  );

  // Helper to fetch products for standard product sections
  const fetchProductsForSection = async (section: any) => {
    try { return await getHomepageProducts(section); }
    catch { return []; }
  };

  return (
    <div className="flex flex-col w-full overflow-hidden">
      {isPreview && (
        <div className="bg-yellow-500 text-slate-900 text-center py-2 font-bold sticky top-0 z-50 text-sm tracking-widest uppercase">
          Preview Mode — Showing Unpublished Draft
        </div>
      )}

      {activeSections.map(section => {
        switch (section.type) {
          case "Hero":
            return (
              <HeroSection 
                key={section.id} 
                config={section.config} 
                products={[]} 
              />
            );

          case "Stats":
            return <StatsSection key={section.id} stats={stats} />;

          case "MarketplacePulse":
            if (!pulse.hasHistory) {
              return (
                <section key={section.id} className="py-16 bg-slate-50 border-b border-slate-200">
                  <div className="container mx-auto px-4 text-center text-slate-500">
                    <div className="inline-block p-4 rounded-full bg-slate-100 mb-4">
                      <div className="h-4 w-4 rounded-full bg-slate-300"></div>
                    </div>
                    <p className="text-lg font-medium">Marketplace data is still building.</p>
                  </div>
                </section>
              );
            }
            return (
              <section key={section.id} className="py-16 bg-slate-50 border-b border-slate-200">
                <div className="container mx-auto px-4">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                    <h2 className="text-xl font-bold text-slate-900">Marketplace Pulse (7 Days)</h2>
                  </div>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                      <div className="text-sm text-slate-500 font-medium mb-4 uppercase tracking-wider">New Products</div>
                      <div className="flex items-end gap-2 h-16">
                        {pulse.history.map((d: any) => (
                          <div key={d.date} className="flex-1 bg-primary/20 rounded-t" style={{ height: `${Math.max(10, d.products * 10)}%` }} title={`${d.date}: ${d.products}`}></div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                      <div className="text-sm text-slate-500 font-medium mb-4 uppercase tracking-wider">Completed Orders</div>
                      <div className="flex items-end gap-2 h-16">
                        {pulse.history.map((d: any) => (
                          <div key={d.date} className="flex-1 bg-blue-500/20 rounded-t" style={{ height: `${Math.max(10, d.orders * 10)}%` }} title={`${d.date}: ${d.orders}`}></div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                      <div className="text-sm text-slate-500 font-medium mb-4 uppercase tracking-wider">Approved Reviews</div>
                      <div className="flex items-end gap-2 h-16">
                        {pulse.history.map((d: any) => (
                          <div key={d.date} className="flex-1 bg-yellow-400/20 rounded-t" style={{ height: `${Math.max(10, d.reviews * 10)}%` }} title={`${d.date}: ${d.reviews}`}></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );

          case "Categories":
            return (
              <CategoriesSection 
                key={section.id} 
                categories={categories} 
                title={section.title} 
                subtitle={section.subtitle} 
              />
            );

          case "WhyAsiaDMarket":
            return <WhyUsSection key={section.id} />;

          case "HowItWorks":
            return <HowItWorksSection key={section.id} />;

          case "TrustSecurity":
            return <TrustSection key={section.id} />;

          case "Newsletter":
            return <NewsletterSection key={section.id} />;

          case "FinalCTA":
            return <FinalCtaSection key={section.id} config={section.config} />;

          case "MarketplaceActivity":
            if (activities.length === 0) return null;
            return (
              <section key={section.id} className="py-16 bg-white border-b border-slate-200">
                <div className="container mx-auto px-4">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                      <Activity className="h-6 w-6 text-primary" />
                      Recent Activity
                    </h2>
                  </div>
                  <div className="space-y-4 max-w-3xl">
                    {activities.map(activity => {
                      let message = activity.eventType;
                      try {
                        if (activity.metadata) {
                          const meta = JSON.parse(activity.metadata);
                          if (meta.message) message = meta.message;
                        }
                      } catch (e) {}
                      return (
                        <div key={activity.id} className="p-4 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-4">
                          <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          <div className="text-slate-700 font-medium">{message}</div>
                          <div className="ml-auto text-sm text-slate-400">
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            );

          case "Reviews":
            return <ReviewListSection key={section.id} reviews={reviews} title={section.title} />;

          case "FeaturedProducts":
          case "TrendingProducts":
          case "BestSellers":
          case "NewArrivals": {
            return (
              <ProductSectionWrapper 
                key={section.id} 
                section={section} 
                fetchData={fetchProductsForSection} 
              />
            );
          }

          // ─── NEW: Category Products Grid ───────────────────────────────────
          case "CategoryProducts": {
            const data = categoryProductDataMap[section.id];
            if (!data || !data.category || data.products.length === 0) return null;

            const { showViewAll, viewAllLabel, useCustomTitle, customTitle, subtitle: sectionSubtitle } = section.config;

            return (
              <CategoryProductSection
                key={section.id}
                category={data.category}
                products={data.products}
                sectionTitle={useCustomTitle && customTitle ? customTitle : (section.title || data.category.name)}
                sectionSubtitle={sectionSubtitle || section.subtitle}
                showViewAll={showViewAll !== false}
                viewAllLabel={viewAllLabel || "View All"}
              />
            );
          }

          // ─── NEW: Blog Post Grid ────────────────────────────────────────────
          case "BlogPosts": {
            const posts = blogDataMap[section.id] || [];
            if (posts.length === 0) return null;

            return (
              <BlogPostSection
                key={section.id}
                posts={posts}
                title={section.title || section.config.title || "Latest from the Blog"}
                subtitle={section.subtitle || section.config.subtitle}
                showViewAll={section.config.showViewAll !== false}
              />
            );
          }

          // ─── NEW: Featured Courses ──────────────────────────────────────────
          case "FeaturedCourses": {
            const courses = featuredCoursesMap[section.id] || [];
            if (courses.length === 0) return null;

            return (
              <section key={section.id} className="py-24 bg-slate-50 border-y border-slate-200">
                <div className="container mx-auto px-4">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-6">
                    <div>
                      <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-slate-900">
                        {section.title || section.config.title || "Featured Courses"}
                      </h2>
                      {(section.subtitle || section.config.subtitle) && (
                        <p className="text-lg text-slate-500">{section.subtitle || section.config.subtitle}</p>
                      )}
                    </div>
                    {section.config.showViewAll !== false && (
                      <Link href="/courses" className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center transition-colors">
                        View All Courses <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Link>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {courses.map(course => (
                      <CourseCard key={course.id} course={course} />
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
}

async function ProductSectionWrapper({ section, fetchData }: { section: any, fetchData: (s: any) => Promise<any[]> }) {
  const products = await fetchData(section);
  
  if (!products || products.length === 0) return null;

  const isDark = section.type === "Spotlight" || section.type === "BestSellers";
  const bgClass = isDark ? "bg-slate-950 text-white border-y border-slate-900" : "bg-white border-y border-slate-100";
  const titleClass = isDark ? "text-white" : "text-slate-900";

  return (
    <section className={`py-24 ${bgClass}`}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-6">
          <div>
            <h2 className={`text-3xl md:text-4xl font-bold tracking-tight mb-3 ${titleClass}`}>
              {section.title || section.type.replace(/([A-Z])/g, ' $1').trim()}
            </h2>
            {section.subtitle && (
              <p className="text-lg text-slate-500">{section.subtitle}</p>
            )}
          </div>
          <Link href="/store" className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center transition-colors">
            View all <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
