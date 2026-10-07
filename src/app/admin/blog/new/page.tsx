import { prisma } from "@/lib/prisma";
import BlogEditor from "@/components/admin/BlogEditor";
import { requireAdmin } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function NewBlogPostPage() {
  await requireAdmin("Content", "Manage");
  const categories = await prisma.blogCategory.findMany();
  return <BlogEditor mode="create" categories={categories} />;
}
