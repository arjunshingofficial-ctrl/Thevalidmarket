"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCategory, updateCategory } from "@/lib/actions/admin";

interface CategoryFormProps {
  initialData?: any;
  categoryId?: string;
  mode: "create" | "edit";
  categories: any[];
}

export default function CategoryForm({ initialData, categoryId, mode, categories }: CategoryFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  const initialCols = (() => {
    try {
      return initialData?.tableColumns ? JSON.parse(initialData.tableColumns) : [
        { label: "Product Name", source: "product.name" },
        { label: "Price", source: "product.price" },
        { label: "Buy Now", source: "system.buy_button" }
      ];
    } catch(e) {
      return [];
    }
  })();
  const [previewCols, setPreviewCols] = useState(initialCols);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const formData = new FormData(e.currentTarget);

    try {
      if (mode === "create") {
        await createCategory(formData);
      } else {
        await updateCategory(categoryId!, formData);
      }
      // router.push("/admin/categories") is handled by server action redirect on create,
      // but for update we might just show a toast or redirect
      if (mode === "edit") router.push("/admin/categories");
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setSaving(false);
    }
  };

  const nameToSlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {mode === "create" ? "New Category" : `Edit: ${initialData?.name}`}
        </h1>
        <p className="text-slate-500 mt-1">Manage product categories and subcategories.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Category Name *</label>
              <input name="name" required defaultValue={initialData?.name}
                onChange={e => {
                  const slugInput = e.currentTarget.form?.elements.namedItem("slug") as HTMLInputElement;
                  if (slugInput && mode === "create") slugInput.value = nameToSlug(e.target.value);
                }}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="e.g. Software, Courses" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Slug *</label>
              <input name="slug" required defaultValue={initialData?.slug}
                className="w-full border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="e.g. software" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea name="description" rows={3} defaultValue={initialData?.description || ""}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder="Brief description of this category..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Parent Category</label>
              <select name="parentId" defaultValue={initialData?.parentId || ""}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">None (Root Category)</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id} disabled={cat.id === categoryId}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Icon (Emoji or URL)</label>
              <input name="icon" defaultValue={initialData?.icon || ""}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="e.g. 💻 or URL" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Image URL</label>
              <input name="image" defaultValue={initialData?.image || ""}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Sort Order</label>
              <input name="sortOrder" type="number" defaultValue={initialData?.sortOrder || 0}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
          </div>

          <div className="pt-4 border-t space-y-4">
            <h3 className="font-semibold text-slate-900 text-sm">Display & Catalog Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Display Mode</label>
                <select name="displayMode" defaultValue={initialData?.displayMode || "GRID"}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="GRID">Grid (Standard Cards)</option>
                  <option value="TABLE">Table (Data Rows)</option>
                  <option value="LIST">List (Horizontal Rows)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Products Per Page</label>
                <select name="productsPerPage" defaultValue={initialData?.productsPerPage || 20}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
            
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Table Columns Configuration (JSON)</label>
              <textarea name="tableColumns" rows={5} defaultValue={initialData?.tableColumns || "[\n  {\"label\": \"Product Name\", \"source\": \"product.name\"},\n  {\"label\": \"Price\", \"source\": \"product.price\"},\n  {\"label\": \"Buy Now\", \"source\": \"system.buy_button\"}\n]"}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    if (Array.isArray(parsed)) {
                      setPreviewCols(parsed);
                    }
                  } catch(err) {
                    // Ignore parsing errors while typing
                  }
                }}
                className="w-full border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                placeholder="JSON configuration for table columns" />
              <p className="text-xs text-slate-500">Only applies when Display Mode is TABLE. Use sources like 'product.name', 'product.price', 'custom_field.country', 'system.buy_button'.</p>
            </div>

            {/* Live Table Preview */}
            <div className="mt-4 p-4 border rounded-xl bg-slate-50/50">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Live Table Preview</h4>
              <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      {previewCols.map((col: any, idx: number) => (
                        <th key={idx} className="px-4 py-3 font-medium text-slate-600 whitespace-nowrap">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {previewCols.map((col: any, idx: number) => (
                        <td key={idx} className="px-4 py-3 text-slate-400 italic whitespace-nowrap">
                          [Data: {col.source}]
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t space-y-4">
            <h3 className="font-semibold text-slate-900 text-sm">SEO</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">SEO Title</label>
              <input name="seoTitle" defaultValue={initialData?.seoTitle || ""}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">SEO Description</label>
              <input name="seoDescription" defaultValue={initialData?.seoDescription || ""}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" name="isActive" value="true" id="isActive"
                defaultChecked={initialData?.isActive !== false}
                className="rounded border-slate-300 text-primary focus:ring-primary" />
              <label htmlFor="isActive" className="text-sm text-slate-700 font-medium">Category is Active</label>
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-slate-50 flex gap-3 justify-end">
          <button type="button" onClick={() => router.back()}
            className="px-4 py-2 border rounded-md text-sm font-medium bg-white hover:bg-slate-50 text-slate-700">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {saving ? "Saving..." : mode === "create" ? "Create Category" : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
