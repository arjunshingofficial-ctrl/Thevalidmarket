import { GET as sitemapIndexHandler } from "../sitemap.xml/route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return sitemapIndexHandler();
}
