"use client";

import { useState } from "react";
import { ReviewModal } from "@/components/reviews/ReviewModal";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { deleteReview } from "@/lib/actions/reviews";

export function WriteReviewButton({
  productId,
  productName,
  isEdit = false,
  initialData,
}: {
  productId: string;
  productName: string;
  isEdit?: boolean;
  initialData?: any;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    setIsDeleting(true);
    try {
      await deleteReview(initialData.id);
    } catch (e) {
      console.error(e);
      alert("Failed to delete review");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isEdit 
              ? "bg-slate-100 text-slate-700 hover:bg-slate-200" 
              : "bg-primary text-white hover:bg-primary/90"
          }`}
        >
          {isEdit ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isEdit ? "Edit Review" : "Write Review"}
        </button>

        {isEdit && initialData && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center justify-center p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
            title="Delete Review"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <ReviewModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        productId={productId}
        productName={productName}
        initialData={initialData}
      />
    </>
  );
}
