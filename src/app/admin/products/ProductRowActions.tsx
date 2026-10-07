"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit, Eye, Archive, Trash2, RefreshCw, X, AlertTriangle, Package, Star } from "lucide-react";

export default function ProductRowActions({ product }: { product: any }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmName, setConfirmName] = useState("");
  
  const confirmInputRef = useRef<HTMLInputElement>(null);

  // Esc key to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!isDeleting && showDeleteModal) setShowDeleteModal(false);
        if (!isArchiving && showArchiveModal) setShowArchiveModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showDeleteModal, showArchiveModal, isDeleting, isArchiving]);

  // Focus input when delete modal opens
  useEffect(() => {
    if (showDeleteModal && confirmInputRef.current) {
      setTimeout(() => confirmInputRef.current?.focus(), 50);
    }
  }, [showDeleteModal]);

  const handleArchiveToggle = async () => {
    setIsArchiving(true);
    setError(null);
    try {
      const newStatus = product.status === "ARCHIVED" ? "DRAFT" : "ARCHIVED";
      const formData = new FormData();
      formData.set("name", product.name);
      formData.set("slug", product.slug);
      formData.set("categoryId", product.categoryId);
      formData.set("type", product.type);
      formData.set("price", product.price.toString());
      if (product.salePrice) formData.set("salePrice", product.salePrice.toString());
      formData.set("status", newStatus);
      formData.set("stock", product.stock.toString());

      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        body: formData
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      setShowArchiveModal(false);
      if (showDeleteModal) setShowDeleteModal(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update archive status");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE"
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete product");
      }
      
      setShowDeleteModal(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to delete product");
    } finally {
      setIsDeleting(false);
    }
  };

  const closeModals = () => {
    if (isDeleting || isArchiving) return;
    setShowDeleteModal(false);
    setShowArchiveModal(false);
    setError(null);
    setConfirmName("");
  };

  return (
    <>
      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link href={`/admin/products/${product.id}/edit`} className="p-1.5 text-slate-400 hover:text-primary rounded hover:bg-slate-100" title="Edit">
          <Edit className="h-4 w-4" />
        </Link>
        <Link href={`/product/${product.slug}`} target="_blank" className="p-1.5 text-slate-400 hover:text-primary rounded hover:bg-slate-100" title="Preview">
          <Eye className="h-4 w-4" />
        </Link>
        <Link href={`/admin/reviews?q=${product.name}`} className="p-1.5 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-100" title="Reviews">
          <Star className="h-4 w-4" />
        </Link>
        
        {product.status === "ARCHIVED" ? (
          <button onClick={() => setShowArchiveModal(true)} className="p-1.5 text-slate-400 hover:text-emerald-600 rounded hover:bg-slate-100" title="Restore">
            <RefreshCw className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={() => setShowArchiveModal(true)} className="p-1.5 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-100" title="Archive">
            <Archive className="h-4 w-4" />
          </button>
        )}

        <button onClick={() => setShowDeleteModal(true)} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100" title="Delete Permanently">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Delete Modal Backdrop */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm whitespace-normal text-left"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          aria-describedby="delete-modal-desc"
        >
          {/* Modal Container */}
          <div className="bg-white rounded-xl shadow-2xl w-[calc(100vw-24px)] md:w-[calc(100vw-32px)] max-w-[440px] overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-slate-500" />
                <h3 id="delete-modal-title" className="text-base font-semibold text-slate-900">
                  Delete Product
                </h3>
              </div>
              <button 
                onClick={closeModals} 
                disabled={isDeleting || isArchiving}
                className="text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors disabled:opacity-50 p-1"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              <div className="mb-6 select-none" id="delete-modal-desc">
                <p className="text-slate-900 text-base font-medium mb-1" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
                  Delete &ldquo;{product.name}&rdquo;?
                </p>
                <p className="text-slate-500 text-sm mb-4">
                  This action cannot be undone and will permanently delete the product from the database.
                </p>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-2 select-none">
              <button 
                onClick={closeModals}
                disabled={isDeleting || isArchiving}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors w-full sm:w-auto text-center"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors w-full sm:w-auto text-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Modal Backdrop */}
      {showArchiveModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm whitespace-normal text-left"
          role="dialog"
          aria-modal="true"
          aria-labelledby="archive-modal-title"
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 id="archive-modal-title" className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {product.status === "ARCHIVED" ? <RefreshCw className="h-5 w-5 text-emerald-600" /> : <Archive className="h-5 w-5 text-amber-600" />}
                {product.status === "ARCHIVED" ? "Restore Product" : "Archive Product"}
              </h3>
              <button 
                onClick={closeModals} 
                disabled={isArchiving}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-slate-600 mb-4 select-none">
                {product.status === "ARCHIVED" 
                  ? <span>Restoring <strong className="text-slate-900">{product.name}</strong> will move it back to DRAFT status. You can publish it again from the editor.</span>
                  : <span>Archiving <strong className="text-slate-900">{product.name}</strong> will remove it from the public store, but keep it in the database and preserve historical orders.</span>}
              </p>
              
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-3 select-none">
              <button 
                onClick={closeModals}
                disabled={isArchiving}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors w-full sm:w-auto text-center"
              >
                Cancel
              </button>
              <button 
                onClick={handleArchiveToggle}
                disabled={isArchiving}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors w-full sm:w-auto text-center disabled:opacity-50 ${
                  product.status === "ARCHIVED" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {isArchiving 
                  ? (product.status === "ARCHIVED" ? "Restoring..." : "Archiving...") 
                  : (product.status === "ARCHIVED" ? "Restore Product" : "Archive Product")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
