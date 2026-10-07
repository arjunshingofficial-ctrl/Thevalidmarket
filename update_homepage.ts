import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });
  
  let config;
  if (settings && settings.homepageConfig) {
    try {
      config = JSON.parse(settings.homepageConfig);
    } catch (e) {
      console.log("Failed to parse existing homepageConfig, creating a new one based on default.");
    }
  }

  // If no config found or parsed, we fall back to a base config
  if (!config || !Array.isArray(config.sections)) {
    config = {
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
  }

  // Check if "bb" section already exists
  const existingBbSection = config.sections.find((s: any) => 
    s.type === "CategoryProducts" && 
    (s.config.categorySlug === "bb" || s.config.categorySlug === "BB")
  );

  if (!existingBbSection) {
    config.sections.push({
      id: "cat-bb-" + Date.now(),
      type: "CategoryProducts",
      enabled: true,
      order: 35,
      title: "BB Collection",
      config: {
        categorySlug: "bb",
        productCount: 4,
        sort: "NEWEST",
        showViewAll: true,
        useCustomTitle: false
      }
    });

    // Re-sort sections
    config.sections.sort((a: any, b: any) => a.order - b.order);

    await prisma.siteSettings.upsert({
      where: { id: "GLOBAL" },
      create: { 
        id: "GLOBAL", 
        homepageConfig: JSON.stringify(config),
        draftConfig: JSON.stringify(config)
      },
      update: { 
        homepageConfig: JSON.stringify(config),
        draftConfig: JSON.stringify(config) // Update draft config too so the live page preview gets it
      }
    });

    console.log("Successfully added BB category section to homepage config.");
  } else {
    console.log("BB category section already exists.");
  }
}

main().then(() => prisma.$disconnect());
