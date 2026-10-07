"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ReviewForm } from "./ReviewForm";

export function ReviewModal({
  productId,
  productName,
  isOpen,
  onClose,
  initialData,
}: {
  productId: string;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    rating: number;
    title: string;
    comment: string;
  };
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg">
        <ReviewForm
          productId={productId}
          productName={productName}
          initialRating={initialData?.rating}
          initialTitle={initialData?.title}
          initialComment={initialData?.comment}
          onSuccess={() => {
            onClose();
            // A page reload or router.refresh() will happen because server action has revalidatePath
          }}
          onCancel={onClose}
        />
      </div>
    </div>,
    document.body
  );
}
