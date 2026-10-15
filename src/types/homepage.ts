export type HomepageSectionType = 
  | "Announcement"
  | "Hero"
  | "Stats"
  | "MarketplacePulse"
  | "TrendingProducts"
  | "Categories"
  | "FeaturedProducts"
  | "ProductSpotlight"
  | "BestSellers"
  | "NewArrivals"
  | "WhyTheValidMarket"
  | "Reviews"
  | "MarketplaceActivity"
  | "HowItWorks"
  | "TrustSecurity"
  | "Newsletter"
  | "FinalCTA"
  | "CategoryProducts"
  | "BlogPosts"
  | "FeaturedCourses";

export type ProductSelectionMode = "AUTOMATIC" | "MANUAL";
export type AutomaticProductMode = "FEATURED" | "NEWEST" | "BEST_SELLING" | "HIGHEST_RATED" | "TRENDING";
export type CategoryProductSort = "NEWEST" | "OLDEST" | "PRICE_ASC" | "PRICE_DESC" | "HIGHEST_RATED" | "FEATURED" | "BEST_SELLING";
export type BlogPostSort = "NEWEST" | "OLDEST" | "FEATURED";

export interface HomepageSection {
  id: string;
  type: HomepageSectionType;
  enabled: boolean;
  order: number;
  title?: string;
  subtitle?: string;
  config: Record<string, any>; // specific config depending on section
}

export interface HomepageConfig {
  sections: HomepageSection[];
}

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  sections: [
    {
      id: "hero-1",
      type: "Hero",
      enabled: true,
      order: 10,
      config: {
        heading: "Everything Digital. One Marketplace.",
        subheading: "Discover premium software, courses, tools, digital assets and professional digital services.",
        primaryCta: "Explore Store",
        primaryCtaUrl: "/store",
        secondaryCta: "Browse Categories",
        secondaryCtaUrl: "/store#categories",
        alignment: "center"
      }
    },
    {
      id: "stats-1",
      type: "Stats",
      enabled: true,
      order: 20,
      config: {}
    },
    {
      id: "featured-1",
      type: "FeaturedProducts",
      enabled: true,
      order: 30,
      title: "Featured Products",
      config: {
        selectionMode: "AUTOMATIC",
        automaticMode: "FEATURED",
        productCount: 4
      }
    }
  ]
};
