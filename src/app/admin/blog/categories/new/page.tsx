import BlogCategoryForm from "@/components/admin/BlogCategoryForm";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Blog Category | Admin - Asia D Market",
  description: "Create a new blog category",
};

export default function NewBlogCategoryPage() {
  return <BlogCategoryForm mode="create" />;
}
