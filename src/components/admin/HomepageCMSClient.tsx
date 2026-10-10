"use client";

import { useState } from "react";
import { Save, Globe, Eye, Plus, ArrowUp, ArrowDown, Trash2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { HomepageConfig, HomepageSection, HomepageSectionType } from "@/types/homepage";

let idCounter = 0;

const SECTION_LABELS: Record<string, string> = {
  Announcement: "📢 Announcement",
  Hero: "🎯 Hero Banner",
  Stats: "📊 Stats Bar",
  MarketplacePulse: "📈 Marketplace Pulse",
  TrendingProducts: "🔥 Trending Products",
  Categories: "📂 Category Grid",
  FeaturedProducts: "⭐ Featured Products",
  ProductSpotlight: "💡 Product Spotlight",
  BestSellers: "🏆 Best Sellers",
  NewArrivals: "🆕 New Arrivals",
  CategoryProducts: "📦 Category Product Grid",
  BlogPosts: "📝 Blog Posts",
  FeaturedCourses: "🎓 Featured Courses",
  WhyAsiaDMarket: "✅ Why Asia D Market",
  Reviews: "💬 Customer Reviews",
  MarketplaceActivity: "⚡ Recent Activity",
  HowItWorks: "🔄 How It Works",
  TrustSecurity: "🔒 Trust & Security",
  Newsletter: "📧 Newsletter",
  FinalCTA: "🚀 Final CTA",
};

const SORT_OPTIONS = [
  { value: "NEWEST", label: "Newest First" },
  { value: "OLDEST", label: "Oldest First" },
  { value: "PRICE_ASC", label: "Price: Low → High" },
  { value: "PRICE_DESC", label: "Price: High → Low" },
  { value: "HIGHEST_RATED", label: "Highest Rated (requires reviews)" },
  { value: "FEATURED", label: "Featured (by sort order)" },
  { value: "BEST_SELLING", label: "Best Selling (requires purchase data)" },
];

const BLOG_SORT_OPTIONS = [
  { value: "NEWEST", label: "Newest First" },
  { value: "OLDEST", label: "Oldest First" },
  { value: "FEATURED", label: "Featured / Recent" },
];

interface Props {
  initialConfig: HomepageConfig;
  isDraft: boolean;
  productCategories?: Array<{ id: string; name: string; slug: string }>;
  blogCategories?: Array<{ id: string; name: string; slug: string }>;
}

export default function HomepageCMSClient({ 
  initialConfig, 
  isDraft,
  productCategories = [],
  blogCategories = [],
}: Props) {
  const [config, setConfig] = useState<HomepageConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const router = useRouter();

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/appearance/homepage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SAVE_DRAFT", config })
      });
      if (res.ok) {
        alert("Draft saved successfully!");
        router.refresh();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm("Are you sure you want to publish these changes to the live site?")) return;
    setPublishing(true);
    try {
      const res = await fetch("/api/admin/appearance/homepage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "PUBLISH", config })
      });
      if (res.ok) {
        alert("Homepage published successfully!");
        router.refresh();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } finally {
      setPublishing(false);
    }
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...config.sections];
    if (direction === 'up' && index > 0) {
      [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    } else if (direction === 'down' && index < newSections.length - 1) {
      [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    }
    newSections.forEach((sec, i) => sec.order = (i + 1) * 10);
    setConfig({ ...config, sections: newSections });
  };

  const toggleEnabled = (index: number) => {
    const newSections = [...config.sections];
    newSections[index].enabled = !newSections[index].enabled;
    setConfig({ ...config, sections: newSections });
  };

  const removeSection = (index: number) => {
    const newSections = config.sections.filter((_, i) => i !== index);
    setConfig({ ...config, sections: newSections });
  };

  const addSection = (type: HomepageSectionType) => {
    // Duplicate check for CategoryProducts: warn if same category already added
    const newSection: HomepageSection = {
      id: `${type.toLowerCase()}-${Date.now()}-${++idCounter}`,
      type,
      enabled: true,
      order: (config.sections.length + 1) * 10,
      config: type === "CategoryProducts" ? { sort: "NEWEST", productCount: 4, showViewAll: true, viewAllLabel: "View All" }
             : type === "BlogPosts" ? { postCount: 3, sort: "NEWEST", showViewAll: true }
             : {}
    };
    setConfig({ ...config, sections: [...config.sections, newSection] });
  };

  const updateConfig = (index: number, key: string, value: any) => {
    const newSections = [...config.sections];
    newSections[index].config = { ...newSections[index].config, [key]: value };
    setConfig({ ...config, sections: newSections });
  };

  const updateSection = (index: number, key: "title" | "subtitle", value: string) => {
    const newSections = [...config.sections];
    (newSections[index] as any)[key] = value;
    setConfig({ ...config, sections: newSections });
  };

  // Check for duplicate categories
  const getCategoryDuplicateWarning = (section: HomepageSection, index: number): string | null => {
    if (section.type !== "CategoryProducts") return null;
    const currentCatId = section.config.categoryId;
    if (!currentCatId) return null;
    const duplicate = config.sections.find((s, i) => 
      i !== index && s.type === "CategoryProducts" && s.config.categoryId === currentCatId
    );
    if (duplicate) {
      const cat = productCategories.find(c => c.id === currentCatId);
      return `"${cat?.name || currentCatId}" is already added to the homepage.`;
    }
    return null;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Homepage CMS</h1>
          <p className="text-slate-500 mt-1">Design and arrange the marketplace homepage.</p>
          {isDraft && <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">Unpublished Draft Exists</span>}
        </div>
        <div className="flex gap-3">
          <a href="/?preview=true" target="_blank" className="bg-slate-100 text-slate-700 px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-slate-200 shadow-sm border border-slate-200">
            <Eye className="h-4 w-4" /> Preview
          </a>
          <button onClick={handleSaveDraft} disabled={saving} className="bg-slate-800 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-slate-700 shadow-sm">
            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Draft"}
          </button>
          <button onClick={handlePublish} disabled={publishing} className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-blue-700 shadow-sm">
            <Globe className="h-4 w-4" /> {publishing ? "Publishing..." : "Publish Live"}
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {config.sections.map((section, index) => {
          const dupWarning = getCategoryDuplicateWarning(section, index);
          return (
            <div key={section.id} className={`bg-white border rounded-xl shadow-sm overflow-hidden transition-all ${!section.enabled ? 'opacity-60 bg-slate-50' : ''} ${dupWarning ? 'border-orange-300' : ''}`}>
              {/* Section Header Bar */}
              <div className="bg-slate-50 p-4 border-b flex justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <button onClick={() => moveSection(index, 'up')} disabled={index === 0} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                    <button onClick={() => moveSection(index, 'down')} disabled={index === config.sections.length - 1} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{SECTION_LABELS[section.type] || section.type}</h3>
                    <p className="text-xs text-slate-400">ID: {section.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {dupWarning && (
                    <span className="flex items-center gap-1 text-xs text-orange-600 font-medium">
                      <AlertTriangle className="h-3 w-3" /> Duplicate
                    </span>
                  )}
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={section.enabled} onChange={() => toggleEnabled(index)} className="rounded text-blue-600" />
                    Enabled
                  </label>
                  <button onClick={() => removeSection(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-md">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Section Config Body */}
              <div className="p-6 space-y-4">
                {/* Duplicate warning */}
                {dupWarning && (
                  <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {dupWarning}
                  </div>
                )}

                {/* HERO config */}
                {section.type === "Hero" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Heading</label>
                      <input type="text" value={section.config.heading || ""} onChange={e => updateConfig(index, 'heading', e.target.value)} className="w-full border rounded p-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Subheading</label>
                      <textarea value={section.config.subheading || ""} onChange={e => updateConfig(index, 'subheading', e.target.value)} className="w-full border rounded p-2 h-20" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Primary CTA Text</label>
                        <input type="text" value={section.config.primaryCta || ""} onChange={e => updateConfig(index, 'primaryCta', e.target.value)} className="w-full border rounded p-2" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Primary CTA URL</label>
                        <input type="text" value={section.config.primaryCtaUrl || ""} onChange={e => updateConfig(index, 'primaryCtaUrl', e.target.value)} className="w-full border rounded p-2" />
                      </div>
                    </div>
                  </>
                )}

                {/* STANDARD PRODUCT SECTIONS config */}
                {["FeaturedProducts", "TrendingProducts", "BestSellers", "NewArrivals"].includes(section.type) && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Section Title</label>
                        <input type="text" value={section.title || ""} onChange={e => updateSection(index, 'title', e.target.value)} className="w-full border rounded p-2" placeholder={section.type} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Product Count</label>
                        <select value={section.config.productCount || 4} onChange={e => updateConfig(index, 'productCount', parseInt(e.target.value))} className="w-full border rounded p-2">
                          {[4, 6, 8, 12].map(n => <option key={n} value={n}>{n} products</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Sort Mode</label>
                      <select value={section.config.automaticMode || "NEWEST"} onChange={e => updateConfig(index, 'automaticMode', e.target.value)} className="w-full border rounded p-2">
                        <option value="NEWEST">Newest</option>
                        <option value="FEATURED">Featured</option>
                        <option value="TRENDING">Trending</option>
                        <option value="BEST_SELLING">Best Selling</option>
                      </select>
                    </div>
                  </>
                )}

                {/* CATEGORY PRODUCTS config */}
                {section.type === "CategoryProducts" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Category <span className="text-red-500">*</span></label>
                      {productCategories.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">No active categories found. Create categories first.</p>
                      ) : (
                        <select
                          value={section.config.categoryId || ""}
                          onChange={e => {
                            const cat = productCategories.find(c => c.id === e.target.value);
                            updateConfig(index, 'categoryId', e.target.value);
                            updateConfig(index, 'categorySlug', cat?.slug || "");
                          }}
                          className="w-full border rounded p-2"
                        >
                          <option value="">— Select a category —</option>
                          {productCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      )}
                      {section.config.categoryId && (
                        <p className="text-xs text-slate-400 mt-1">
                          View All URL: <code>/category/{section.config.categorySlug || "..."}</code>
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Section Title</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm text-slate-600">
                            <input type="checkbox" checked={!!section.config.useCustomTitle} onChange={e => updateConfig(index, 'useCustomTitle', e.target.checked)} />
                            Use custom title
                          </label>
                          {section.config.useCustomTitle ? (
                            <input
                              type="text"
                              value={section.config.customTitle || ""}
                              onChange={e => updateConfig(index, 'customTitle', e.target.value)}
                              className="w-full border rounded p-2"
                              placeholder="e.g. Best CC Products"
                            />
                          ) : (
                            <p className="text-sm text-slate-400 italic">
                              Auto: will use the category name
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Product Count</label>
                        <select value={section.config.productCount || 4} onChange={e => updateConfig(index, 'productCount', parseInt(e.target.value))} className="w-full border rounded p-2">
                          {[4, 6, 8, 12].map(n => <option key={n} value={n}>{n} products</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Sort Products By</label>
                        <select value={section.config.sort || "NEWEST"} onChange={e => updateConfig(index, 'sort', e.target.value)} className="w-full border rounded p-2">
                          {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Subtitle (optional)</label>
                        <input type="text" value={section.config.subtitle || ""} onChange={e => updateConfig(index, 'subtitle', e.target.value)} className="w-full border rounded p-2" placeholder="Short description" />
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={section.config.showViewAll !== false} onChange={e => updateConfig(index, 'showViewAll', e.target.checked)} className="rounded" />
                        Show "View All" link
                      </label>
                      {section.config.showViewAll !== false && (
                        <div className="flex-1">
                          <input type="text" value={section.config.viewAllLabel || "View All"} onChange={e => updateConfig(index, 'viewAllLabel', e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="View All" />
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* BLOG POSTS config */}
                {section.type === "BlogPosts" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Section Title</label>
                        <input type="text" value={section.title || section.config.title || ""} onChange={e => { updateSection(index, 'title', e.target.value); updateConfig(index, 'title', e.target.value); }} className="w-full border rounded p-2" placeholder="Latest from the Blog" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Post Count</label>
                        <select value={section.config.postCount || 3} onChange={e => updateConfig(index, 'postCount', parseInt(e.target.value))} className="w-full border rounded p-2">
                          {[3, 4, 6, 8].map(n => <option key={n} value={n}>{n} posts</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Sort By</label>
                        <select value={section.config.sort || "NEWEST"} onChange={e => updateConfig(index, 'sort', e.target.value)} className="w-full border rounded p-2">
                          {BLOG_SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Subtitle (optional)</label>
                        <input type="text" value={section.config.subtitle || section.subtitle || ""} onChange={e => { updateConfig(index, 'subtitle', e.target.value); updateSection(index, 'subtitle', e.target.value); }} className="w-full border rounded p-2" placeholder="Short description" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Filter by Blog Category (optional)</label>
                      {blogCategories.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">No blog categories found.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {blogCategories.map(cat => {
                            const selected = (section.config.categoryIds || []).includes(cat.id);
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  const current: string[] = section.config.categoryIds || [];
                                  const next = selected ? current.filter((id: string) => id !== cat.id) : [...current, cat.id];
                                  updateConfig(index, 'categoryIds', next);
                                }}
                                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
                              >
                                {cat.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {(section.config.categoryIds?.length > 0) && (
                        <p className="text-xs text-slate-400 mt-1">Showing posts from selected categories only. Clear all to show all categories.</p>
                      )}
                    </div>

                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={section.config.showViewAll !== false} onChange={e => updateConfig(index, 'showViewAll', e.target.checked)} className="rounded" />
                      Show "View All Articles" link → /blog
                    </label>
                  </>
                )}

                {/* FEATURED COURSES config */}
                {section.type === "FeaturedCourses" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Section Title</label>
                        <input type="text" value={section.title || section.config.title || ""} onChange={e => { updateSection(index, 'title', e.target.value); updateConfig(index, 'title', e.target.value); }} className="w-full border rounded p-2" placeholder="Featured Courses" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Subtitle (optional)</label>
                        <input type="text" value={section.config.subtitle || section.subtitle || ""} onChange={e => { updateConfig(index, 'subtitle', e.target.value); updateSection(index, 'subtitle', e.target.value); }} className="w-full border rounded p-2" placeholder="Learn practical skills" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Selection Mode</label>
                        <select value={section.config.selectionMode || "AUTOMATIC"} onChange={e => updateConfig(index, 'selectionMode', e.target.value)} className="w-full border rounded p-2">
                          <option value="AUTOMATIC">Automatic</option>
                          <option value="MANUAL">Manual</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Product Count</label>
                        <select value={section.config.productCount || 4} onChange={e => updateConfig(index, 'productCount', parseInt(e.target.value))} className="w-full border rounded p-2">
                          {[3, 4, 6, 8, 12].map(n => <option key={n} value={n}>{n} courses</option>)}
                        </select>
                      </div>
                    </div>
                    
                    {section.config.selectionMode === "MANUAL" ? (
                      <div>
                        <label className="block text-sm font-medium mb-1">Selected Courses (Comma separated IDs/Slugs)</label>
                        <input type="text" value={Array.isArray(section.config.productIds) ? section.config.productIds.join(", ") : (section.config.productIds || "")} onChange={e => {
                          const ids = e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean);
                          updateConfig(index, 'productIds', ids);
                        }} className="w-full border rounded p-2" placeholder="course-id-1, course-id-2" />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium mb-1">Sort Mode</label>
                        <select value={section.config.automaticMode || "NEWEST"} onChange={e => updateConfig(index, 'automaticMode', e.target.value)} className="w-full border rounded p-2">
                          <option value="NEWEST">Newest</option>
                          <option value="FEATURED">Featured</option>
                          <option value="HIGHEST_RATED">Highest Rated</option>
                          <option value="BEST_SELLING">Most Popular (Best Selling)</option>
                        </select>
                      </div>
                    )}

                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={section.config.showViewAll !== false} onChange={e => updateConfig(index, 'showViewAll', e.target.checked)} className="rounded" />
                      Show "View All Courses" link → /courses
                    </label>
                  </>
                )}

                {/* Simple message for sections with no config */}
                {!["Hero", "FeaturedProducts", "TrendingProducts", "BestSellers", "NewArrivals", "CategoryProducts", "BlogPosts", "FeaturedCourses"].includes(section.type) && (
                  <p className="text-sm text-slate-400 italic">This section has no configurable options. Toggle enabled/disabled above.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Section */}
      <div className="bg-slate-50 border rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-slate-700 mb-4 text-center">Add New Section</h3>
        
        {/* Category Product Sections — Prominent */}
        <div className="mb-4 p-4 bg-white border border-primary/20 rounded-lg">
          <p className="text-xs font-bold text-primary/70 uppercase tracking-widest mb-2">Category Product Grids</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => addSection("CategoryProducts")}
              className="px-4 py-2 bg-primary/10 text-primary border border-primary/30 rounded-lg text-sm font-semibold hover:bg-primary/20 flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Category Product Grid
            </button>
            <button
              onClick={() => addSection("BlogPosts")}
              className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-semibold hover:bg-blue-100 flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Blog Posts Grid
            </button>
            <button
              onClick={() => addSection("FeaturedCourses")}
              className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-semibold hover:bg-emerald-100 flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Featured Courses
            </button>
          </div>
        </div>

        {/* All other sections */}
        <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Other Sections</p>
        <div className="flex flex-wrap justify-center gap-2">
          {(["Hero", "Stats", "MarketplacePulse", "TrendingProducts", "Categories", "FeaturedProducts", "ProductSpotlight", "BestSellers", "NewArrivals", "WhyAsiaDMarket", "Reviews", "MarketplaceActivity", "HowItWorks", "TrustSecurity", "Newsletter", "FinalCTA"] as HomepageSectionType[]).map(type => (
            <button key={type} onClick={() => addSection(type)} className="px-3 py-1.5 bg-white border rounded text-sm hover:bg-slate-100 flex items-center gap-1 shadow-sm">
              <Plus className="h-3 w-3" /> {type}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
