import { prisma } from "@/lib/prisma";
import BlogEditor from "@/components/admin/BlogEditor";
import { requireAdmin } from "@/lib/actions/admin";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("Content", "Manage");
  const { id } = await params;
  
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();
  
  const categories = await prisma.blogCategory.findMany();
  return <BlogEditor mode="edit" initialData={post} categories={categories} postId={id} />;
}
