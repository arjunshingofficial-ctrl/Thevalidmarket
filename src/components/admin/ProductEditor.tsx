"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RichTextEditor from "./RichTextEditor";
import ProductFileUploader from "./ProductFileUploader";
import MediaSelector from "./MediaSelector";
import { normalizeImageUrl } from "@/lib/storage/client";
import { X, Tag, Plus } from "lucide-react";

type Tab = {
  id: string;
  label: string;
};

const TABS: Tab[] = [
  { id: "general", label: "General" },
  { id: "pricing", label: "Pricing" },
  { id: "media", label: "Media" },
  { id: "custom-fields", label: "Custom Fields" },
  { id: "description", label: "Description" },
  { id: "specifications", label: "Specifications" },
  { id: "files", label: "Files" },
  { id: "license", label: "License" },
  { id: "subscription", label: "Subscription" },
  { id: "seo", label: "SEO" },
  { id: "related", label: "Related Products" },
  { id: "advanced", label: "Advanced" },
];

const PRODUCT_TYPES = [
  "DIGITAL_DOWNLOAD", "SOFTWARE", "COURSE", "LICENSE", "SUBSCRIPTION",
  "VPN", "PROXY", "TEMPLATE", "DIGITAL_ASSET", "SERVICE"
];

interface ProductEditorProps {
  categories: { id: string; name: string }[];
  fieldDefinitions: { id: string; name: string; type: string; slug: string; required: boolean; options: string | null; applyToTypes: string | null }[];
  initialData?: any;
  mode: "create" | "edit";
  productId?: string;
}

export default function ProductEditor({ categories, fieldDefinitions, initialData, mode, productId }: ProductEditorProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState((initialData?.status as string) || "DRAFT");
  const [productType, setProductType] = useState((initialData?.type as string) || "DIGITAL_DOWNLOAD");
  
  const [name, setName] = useState((initialData?.name as string) || "");
  const [slug, setSlug] = useState((initialData?.slug as string) || "");

  const initialMetadata = initialData?.metadata ? JSON.parse(initialData.metadata as string) : {};
  const [featuredImage, setFeaturedImage] = useState<string>(initialMetadata.image || "");
  const [gallery, setGallery] = useState<string[]>(initialMetadata.gallery || []);
  const [mediaTarget, setMediaTarget] = useState<"featured" | "gallery">("featured");
  const [tags, setTags] = useState<string[]>(
    Array.isArray(initialMetadata.tags) 
      ? initialMetadata.tags 
      : typeof initialMetadata.tags === "string" && initialMetadata.tags.length > 0 
        ? initialMetadata.tags.split(",").map((t: string) => t.trim()) 
        : []
  );
  const [tagInput, setTagInput] = useState("");
  
  const router = useRouter();

  const getFieldValue = (slug: string) => {
    if (!initialData?.fieldValues) return "";
    const match = (initialData.fieldValues as any[]).find(fv => fv.field.slug === slug);
    return match ? match.value : "";
  };

  const applicableFields = fieldDefinitions.filter(f => {
    if (!f.applyToTypes) return true;
    try {
      const types = JSON.parse(f.applyToTypes) as string[];
      return types.includes(productType);
    } catch { return true; }
  });

  const handleChange = () => setIsDirty(true);
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (!initialData?.slug && mode === "create") {
      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""));
    }
    handleChange();
  };

  const handleAddTag = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== 'Enter' && e.key !== ',') return;
    if (e && 'preventDefault' in e) e.preventDefault();
    const trimmed = tagInput.trim().replace(/^,+|,+$/g, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setIsDirty(true);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
    setIsDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, publishStatus?: string) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    // Validate required fields
    const prodName = (formData.get("name") as string)?.trim();
    if (!prodName) {
      setActiveTab("general");
      setError("Product Name is required.");
      return;
    }

    const prodCategory = (formData.get("categoryId") as string)?.trim();
    if (!prodCategory) {
      setActiveTab("general");
      setError("Please select a Category.");
      return;
    }

    const priceRaw = parseFloat(formData.get("price") as string);
    if (publishStatus === "PUBLISHED" && (isNaN(priceRaw) || priceRaw < 0)) {
      setActiveTab("pricing");
      setError("Please enter a valid price before publishing.");
      return;
    }

    setSaving(true);
    setError(null);
    if (publishStatus) formData.set("status", publishStatus);
    formData.set("gallery", JSON.stringify(gallery));
    formData.set("tags", JSON.stringify(tags));

    const endpoint = mode === "create" ? "/api/admin/products" : `/api/admin/products/${productId}`;
    const method = mode === "create" ? "POST" : "PUT";

    try {
      const res = await fetch(endpoint, { method, body: formData });
      
      if (res.ok) {
        setIsDirty(false);
        const data = await res.json();
        if (mode === "create") {
          router.push(`/admin/products/${data.id}/edit`);
        } else {
          router.refresh();
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to save product.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onChange={handleChange} onSubmit={(e) => handleSubmit(e)} noValidate className="space-y-6 pb-20 relative">
      <div className="sticky top-0 z-20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/90 backdrop-blur-md p-4 border rounded-xl shadow-sm mt-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {mode === "create" ? "New Product" : `Edit: ${initialData?.name as string}`}
          </h1>
          {isDirty && <span className="text-xs text-amber-600 font-medium mt-1 block">● Unsaved changes</span>}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {error && <span className="text-sm text-red-600 font-medium mr-2">{error}</span>}
          <button
            type="button"
            disabled={saving}
            onClick={(e) => {
              const form = (e.currentTarget.closest("form") || document.querySelector("form")) as HTMLFormElement;
              handleSubmit({ currentTarget: form, preventDefault: () => {} } as React.FormEvent<HTMLFormElement>, "DRAFT");
            }}
            className="px-4 py-2 border rounded-md text-sm font-medium bg-white hover:bg-slate-50 text-slate-700 shadow-sm disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            type="button"
            disabled={saving || mode === "create"}
            className="px-4 py-2 border rounded-md text-sm font-medium bg-white hover:bg-slate-50 text-slate-700 shadow-sm disabled:opacity-50"
            onClick={() => window.open(`/product/${initialData?.slug || ""}`, "_blank")}
          >
            Preview
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={(e) => {
              const form = (e.currentTarget.closest("form") || document.querySelector("form")) as HTMLFormElement;
              handleSubmit({ currentTarget: form, preventDefault: () => {} } as React.FormEvent<HTMLFormElement>, "PUBLISHED");
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 shadow-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Publish"}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
          <div className="bg-white rounded-xl border shadow-sm p-2">
            <div className="lg:hidden p-2">
              <select 
                value={activeTab} 
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {TABS.map(tab => (
                  <option key={tab.id} value={tab.id}>{tab.label}</option>
                ))}
              </select>
            </div>
            <nav className="hidden lg:block space-y-1">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-4 space-y-4">
            <h3 className="font-semibold text-slate-900 text-sm">Status</h3>
            <select name="status" value={status} onChange={e => { setStatus(e.target.value); handleChange(); }}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            
            <div className="pt-4 border-t">
              <h3 className="font-semibold text-slate-900 text-sm mb-2">Quick Info</h3>
              <div className="text-sm space-y-2 text-slate-600">
                <div className="flex justify-between">
                  <span>Type</span>
                  <span className="font-medium text-slate-900">{productType.replace(/_/g, " ")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border shadow-sm p-6">
            
            <div data-tab-id="general" className={activeTab === "general" ? "block" : "hidden"}>
              <h2 className="text-lg font-semibold text-slate-900 mb-6">General Information</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Product Name *</label>
                    <input name="name" required value={name} onChange={handleNameChange}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="e.g. Premium VPN Subscription" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Slug *</label>
                    <input name="slug" required value={slug} onChange={e => { setSlug(e.target.value); handleChange(); }}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="e.g. premium-vpn-subscription" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">SKU</label>
                    <input name="sku" defaultValue={initialData?.sku as string}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="ADM-001" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Category *</label>
                    <select name="categoryId" required defaultValue={initialData?.categoryId as string}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Product Type *</label>
                    <select name="type" required value={productType} onChange={e => { setProductType(e.target.value); handleChange(); }}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                      {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Short Description</label>
                  <textarea name="shortDesc" rows={2} defaultValue={initialData?.shortDesc as string}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    placeholder="Brief description shown on product cards" />
                </div>
              </div>
            </div>

            <div data-tab-id="pricing" className={activeTab === "pricing" ? "block" : "hidden"}>
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Pricing & Inventory</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Price ($) *</label>
                    <input name="price" type="number" step="0.01" min="0" defaultValue={initialData?.price as number}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Compare Price ($)</label>
                    <input name="comparePrice" type="number" step="0.01" min="0" defaultValue={initialData?.comparePrice as number}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Sale Price ($)</label>
                    <input name="salePrice" type="number" step="0.01" min="0" defaultValue={initialData?.salePrice as number}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Stock</label>
                    <input name="stock" type="number" defaultValue={(initialData?.stock as number) || 0}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div className="space-y-2 flex flex-col justify-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="unlimitedStock" value="true" defaultChecked={(initialData?.stock as number) === -1}
                        className="rounded border-slate-300 text-primary focus:ring-primary" />
                      <span className="text-sm font-medium text-slate-700">Unlimited Stock</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div data-tab-id="custom-fields" className={activeTab === "custom-fields" ? "block" : "hidden"}>
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Custom Fields</h2>
              <div className="space-y-4">
                <p className="text-sm text-slate-500">
                  These are dynamic fields defined for <strong>{productType.replace(/_/g, " ")}</strong> products.
                </p>
                {applicableFields.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 border border-dashed rounded-lg bg-slate-50">
                    <p className="font-medium">No custom fields defined for this product type.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applicableFields.map(field => (
                      <div key={field.id} className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                          {field.name} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {field.type === "TEXT" && (
                          <input name={`field_${field.slug}`}
                            defaultValue={getFieldValue(field.slug)}
                            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            required={field.required} />
                        )}
                        {field.type === "NUMBER" && (
                          <input name={`field_${field.slug}`} type="number"
                            defaultValue={getFieldValue(field.slug)}
                            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            required={field.required} />
                        )}
                        {field.type === "URL" && (
                          <input name={`field_${field.slug}`} type="url"
                            defaultValue={getFieldValue(field.slug)}
                            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            required={field.required} />
                        )}
                        {field.type === "BOOLEAN" && (
                          <label className="flex items-center gap-2 mt-2">
                            <input name={`field_${field.slug}`} type="checkbox" value="true"
                              defaultChecked={getFieldValue(field.slug) === "true"}
                              className="rounded border-slate-300 text-primary focus:ring-primary" />
                            <span className="text-sm text-slate-600">Yes</span>
                          </label>
                        )}
                        {field.type === "DATE" && (
                          <input name={`field_${field.slug}`} type="date"
                            defaultValue={getFieldValue(field.slug)}
                            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            required={field.required} />
                        )}
                        {(field.type === "DROPDOWN" || field.type === "MULTI_SELECT") && (() => {
                          const opts = field.options ? JSON.parse(field.options) as string[] : [];
                          const isMulti = field.type === "MULTI_SELECT";
                          const val = getFieldValue(field.slug);
                          const defVal = isMulti ? (val ? val.split(",") : []) : val;
                          
                          return (
                            <select name={`field_${field.slug}`}
                              multiple={isMulti}
                              defaultValue={defVal}
                              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                              required={field.required}>
                              <option value="">Select…</option>
                              {opts.map((o: string) => <option key={o} value={o}>{o}</option>)}
                            </select>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div data-tab-id="description" className={activeTab === "description" ? "block" : "hidden"}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-4 border-b">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">Product Content & Description Studio</h2>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">Visual Editor</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Design rich product descriptions, feature comparison tables, callout banners, and embed YouTube/Vimeo videos.
                  </p>
                </div>
                <div className="text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 hidden sm:block">
                  💡 Tip: Click Fullscreen for a distraction-free writing experience
                </div>
              </div>
              <div className="space-y-2">
                <RichTextEditor name="description" defaultValue={initialData?.description as string || ""} placeholder="Write comprehensive product description, specs, instructions, and embed media..." />
              </div>
            </div>

            <div data-tab-id="seo" className={activeTab === "seo" ? "block" : "hidden"}>
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Search Engine Optimization</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">SEO Title</label>
                  <input name="seoTitle" defaultValue={initialData?.name as string}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Meta Description</label>
                  <textarea name="metaDescription" rows={3} defaultValue={initialData?.shortDesc as string}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Canonical URL</label>
                  <input name="canonicalUrl"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder={`/product/${initialData?.slug || ""}`} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Robots</label>
                  <select name="robots" className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="index,follow">index, follow (default)</option>
                    <option value="noindex,follow">noindex, follow</option>
                    <option value="noindex,nofollow">noindex, nofollow</option>
                  </select>
                </div>
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Tag className="w-4 h-4 text-primary" /> Product Tags & SEO Keywords</span>
                    <span className="text-xs text-slate-400">Helps search engine indexing & ranking</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          handleAddTag(e);
                        }
                      }}
                      placeholder="Add SEO tag (e.g. windows 11, pro license, instant delivery) and press Enter"
                      className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTag()}
                      className="px-3 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add Tag
                    </button>
                  </div>
                  {tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-red-600 transition-colors ml-0.5"
                            title="Remove tag"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No tags added yet. Add keywords relevant to your product.</p>
                  )}
                  <p className="text-xs text-slate-500">
                    Press Enter or comma to add. These tags will be embedded in metadata keywords and improve ranking.
                  </p>
                </div>
              </div>
            </div>

            <div data-tab-id="advanced" className={activeTab === "advanced" ? "block" : "hidden"}>
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Advanced Settings</h2>
              <div className="space-y-4">
                <div className="space-y-4 divide-y">
                  {[
                    { name: "featured", label: "Featured Product", desc: "Show in featured sections" },
                    { name: "isBestSeller", label: "Best Seller", desc: "Show best seller badge" },
                    { name: "isNew", label: "New Arrival", desc: "Show new arrival badge" },
                  ].map(item => (
                    <div key={item.name} className="flex items-center justify-between pt-4 first:pt-0">
                      <div>
                        <div className="text-sm font-medium text-slate-900">{item.label}</div>
                        <div className="text-xs text-slate-500">{item.desc}</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name={item.name} value="true" className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div data-tab-id="files" className={activeTab === "files" ? "block" : "hidden"}>
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Downloadable Files</h2>
              <div className="space-y-4">
                {mode === "create" ? (
                  <div className="py-12 text-center text-slate-400 border border-dashed rounded-lg bg-slate-50">
                    <p className="font-medium">Save the product first</p>
                    <p className="text-sm mt-1">You must create the product before uploading files.</p>
                  </div>
                ) : (
                  <ProductFileUploader productId={productId!} initialFiles={initialData?.files || []} />
                )}
              </div>
            </div>

            <div data-tab-id="media" className={activeTab === "media" ? "block" : "hidden"}>
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Media Library</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 flex justify-between">
                      <span>Featured Image URL</span>
                      <button type="button" onClick={() => setMediaTarget("featured")} className={`text-xs px-2 py-1 rounded ${mediaTarget === "featured" ? "bg-primary text-white" : "bg-slate-100"}`}>Select from Media</button>
                    </label>
                    <input name="image" value={featuredImage} onChange={e => { setFeaturedImage(e.target.value); handleChange(); }}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Paste URL..." 
                      id="featured-image-input"
                    />
                    {featuredImage && (
                      <div className="mt-2 aspect-video relative rounded-md overflow-hidden bg-slate-100 border">
                        <img src={normalizeImageUrl(featuredImage)} alt="Featured" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => { setFeaturedImage(""); handleChange(); }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs">×</button>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 flex justify-between">
                      <span>Gallery Images</span>
                      <button type="button" onClick={() => setMediaTarget("gallery")} className={`text-xs px-2 py-1 rounded ${mediaTarget === "gallery" ? "bg-primary text-white" : "bg-slate-100"}`}>Add to Gallery</button>
                    </label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {gallery.map((url, i) => (
                        <div key={i} className="aspect-square relative rounded-md overflow-hidden bg-slate-100 border">
                          <img src={normalizeImageUrl(url)} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => { setGallery(gallery.filter((_, idx) => idx !== i)); handleChange(); }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center text-xs">×</button>
                        </div>
                      ))}
                      {gallery.length === 0 && (
                        <div className="col-span-3 text-xs text-slate-400 p-4 text-center border border-dashed rounded">No gallery images added.</div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="font-medium text-sm mb-4">Select Media ({mediaTarget === "featured" ? "Featured Image" : "Gallery Image"})</h3>
                  <MediaSelector onSelect={(url) => {
                    if (mediaTarget === "featured") {
                      setFeaturedImage(url);
                    } else {
                      if (!gallery.includes(url)) setGallery([...gallery, url]);
                    }
                    setIsDirty(true);
                  }} />
                </div>
              </div>
            </div>

            <div data-tab-id="specifications" className={activeTab === "specifications" ? "block" : "hidden"}>
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Technical Specifications</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Specifications (JSON format)</label>
                  <textarea name="specifications" rows={10} defaultValue={initialData?.metadata ? JSON.stringify(JSON.parse(initialData.metadata).specifications || {}, null, 2) : "{}"}
                    className="w-full border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
            </div>

            <div data-tab-id="license" className={activeTab === "license" ? "block" : "hidden"}>
              <h2 className="text-lg font-semibold text-slate-900 mb-6">License Settings</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="requiresLicense" defaultChecked={productType === "SOFTWARE" || productType === "LICENSE"} className="rounded border-slate-300 text-primary" />
                    <span className="text-sm font-medium text-slate-700">Requires License Key</span>
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">License Type</label>
                  <select name="licenseType" className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="LIFETIME">Lifetime</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
              </div>
            </div>

            <div data-tab-id="subscription" className={activeTab === "subscription" ? "block" : "hidden"}>
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Subscription Settings</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Billing Interval</label>
                  <select name="billingInterval" className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">One-time purchase</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
              </div>
            </div>

            <div data-tab-id="related" className={activeTab === "related" ? "block" : "hidden"}>
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Related Products</h2>
              <div className="space-y-4">
                <p className="text-sm text-slate-500">Select products that will be suggested as related items.</p>
                <div className="py-8 text-center text-slate-400 border border-dashed rounded-lg bg-slate-50">
                  <p className="font-medium">No related products selected.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </form>
  );
}
