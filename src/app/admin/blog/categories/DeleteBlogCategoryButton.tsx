"use client";

import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteBlogCategory } from "@/lib/actions/blog-categories";

export default function DeleteBlogCategoryButton({
  categoryId,
  categoryName,
  postsCount,
}: {
  categoryId: string;
  categoryName: string;
  postsCount: number;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmMessage = postsCount > 0
      ? `Are you sure you want to delete "${categoryName}"? ${postsCount} post(s) currently linked to this category will be unassigned.`
      : `Are you sure you want to delete "${categoryName}"?`;

    if (!confirm(confirmMessage)) return;

    setIsDeleting(true);
    try {
      await deleteBlogCategory(categoryId);
      router.refresh();
    } catch (e: any) {
      alert(e?.message || "Error deleting category");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      title="Delete Category"
      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
    >
      {isDeleting ? (
        <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </button>
  );
}
