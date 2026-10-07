import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/actions/admin";
import HomepageCMSClient from "@/components/admin/HomepageCMSClient";
import { getHomepageConfig, getProductCategoriesForAdmin, getBlogCategoriesForAdmin } from "@/lib/data/homepage";

export const dynamic = "force-dynamic";

export default async function HomepageCMSPage() {
  await requireAdmin("Settings", "Manage");

  // Get settings explicitly to see if draft is out of sync with published
  const settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });
  
  // The backend uses getHomepageConfig from data layer
  const initialConfig = await getHomepageConfig(true); // default to load draft config in the CMS!

  // Determine if draft is different from published (meaning unsaved changes exist)
  const isDraft = settings?.draftConfig && settings?.homepageConfig && settings.draftConfig !== settings.homepageConfig;

  // Fetch categories for the section editors
  const [productCategories, blogCategories] = await Promise.all([
    getProductCategoriesForAdmin(),
    getBlogCategoriesForAdmin(),
  ]);

  return (
    <div className="p-4 md:p-8">
      <HomepageCMSClient 
        initialConfig={initialConfig} 
        isDraft={!!isDraft}
        productCategories={productCategories}
        blogCategories={blogCategories}
      />
    </div>
  );
}
