import fs from "fs";
import path from "path";

export const dynamic = "force-static";
export const revalidate = 86400; // 24 hours

export async function GET() {
  const filePath = path.join(process.cwd(), "public", "sitemap.xsl");
  const xsl = fs.readFileSync(filePath, "utf-8");

  return new Response(xsl, {
    status: 200,
    headers: {
      "Content-Type": "text/xsl; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
