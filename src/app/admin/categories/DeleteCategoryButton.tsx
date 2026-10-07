"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteCategoryButton({ 
  categoryId, 
  disabled, 
  title 
}: { 
  categoryId: string; 
  disabled?: boolean; 
  title?: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this category?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/categories/${categoryId}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to delete");
      } else {
        router.refresh();
      }
    } catch (e) {
      alert("Error deleting category");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button 
      onClick={handleDelete}
      disabled={disabled || isDeleting}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        disabled 
          ? "text-slate-300 cursor-not-allowed opacity-50" 
          : "text-slate-400 hover:text-red-600 hover:bg-slate-100"
      }`}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
