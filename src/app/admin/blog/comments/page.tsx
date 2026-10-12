import { requireAdmin } from "@/lib/actions/admin";
import BlogCommentsManager from "@/components/admin/BlogCommentsManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Blog Comments Moderation - Admin",
  description: "Moderate, edit, approve, and manage user comments on blog posts.",
};

export default async function AdminBlogCommentsPage() {
  await requireAdmin("Content", "View");

  return <BlogCommentsManager />;
}
