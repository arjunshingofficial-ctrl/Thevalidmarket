"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2, GripVertical, Check, EyeOff, Eye } from "lucide-react";
import { addMenuItem, updateMenuItem, deleteMenuItem, reorderMenuItems } from "@/lib/actions/menus";
import HeaderClient from "@/components/layout/HeaderClient";

export default function MenuBuilderClient({ initialMenus }: { initialMenus: any[] }) {
  const [activeMenuId, setActiveMenuId] = useState(initialMenus[0]?.id || "");
  const [menus, setMenus] = useState(initialMenus);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const activeMenu = menus.find(m => m.id === activeMenuId);
  const items = activeMenu?.items || [];

  // Form State
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("CUSTOM_URL");
  const [openInNew, setOpenInNew] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [authVisibility, setAuthVisibility] = useState("EVERYONE");
  const [parentId, setParentId] = useState("");

  const resetForm = () => {
    setLabel(""); setUrl(""); setType("CUSTOM_URL"); setOpenInNew(false);
    setIsVisible(true); setAuthVisibility("EVERYONE"); setParentId("");
    setIsAdding(false); setEditingItem(null);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setLabel(item.label);
    setUrl(item.url);
    setType(item.type);
    setOpenInNew(item.openInNew);
    setIsVisible(item.isVisible);
    setAuthVisibility(item.authVisibility);
    setParentId(item.parentId || "");
    setIsAdding(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !url) return alert("Label and URL are required.");

    const payload = { menuId: activeMenuId, label, url, type, openInNew, isVisible, authVisibility, parentId: parentId || null };
    
    try {
      if (editingItem) {
        await updateMenuItem(editingItem.id, payload);
      } else {
        await addMenuItem(payload);
      }
      // Quick refresh logic (in reality, should update state or router.refresh)
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Failed to save menu item");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this menu item?")) return;
    try {
      await deleteMenuItem(id);
      window.location.reload();
    } catch (error) {
      alert("Failed to delete menu item");
    }
  };

  const moveItem = async (index: number, direction: -1 | 1) => {
    const newItems = [...items];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    
    // Swap
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    
    // Update state optimistically
    const updatedMenus = menus.map(m => {
      if (m.id === activeMenuId) return { ...m, items: newItems };
      return m;
    });
    setMenus(updatedMenus);

    // Save
    const payload = newItems.map((it, idx) => ({ id: it.id, sortOrder: idx, parentId: it.parentId }));
    await reorderMenuItems(payload);
  };

  return (
    <div className="space-y-8">
      {/* HEADER PREVIEW (Only if editing Main Header) */}
      {activeMenu?.location === "HEADER_MAIN" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm overflow-hidden">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Header Live Preview</h3>
          <div className="border border-slate-200 rounded-lg bg-slate-50 relative z-10 w-full overflow-x-auto">
            <div className="min-w-[1024px]">
              <HeaderClient session={{ user: { name: "Admin Test" } }} menuItems={items} />
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[300px_1fr] gap-8 items-start">
        
        {/* Left sidebar: Menu List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h2 className="font-semibold text-slate-900">Menus</h2>
          </div>
          <div className="p-2 space-y-1">
            {menus.map((menu) => (
              <button
                key={menu.id}
                onClick={() => setActiveMenuId(menu.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeMenuId === menu.id ? "bg-primary text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {menu.name}
              </button>
            ))}
          </div>
        </div>

        {/* Right side: Menu Editor */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Edit: {activeMenu?.name}</h2>
            <button 
              onClick={() => { resetForm(); setIsAdding(true); }}
              className="flex items-center gap-2 text-sm font-medium text-white bg-primary px-4 py-2 rounded-lg hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              Add Menu Item
            </button>
          </div>

          <div className="p-6">
            {items.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p>No items in this menu yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item: any, idx: number) => (
                  <div key={item.id} className="border border-slate-200 rounded-lg bg-white overflow-hidden">
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <button onClick={() => moveItem(idx, -1)} disabled={idx === 0} className="text-slate-400 hover:text-primary disabled:opacity-30"><ChevronUpIcon /></button>
                          <button onClick={() => moveItem(idx, 1)} disabled={idx === items.length - 1} className="text-slate-400 hover:text-primary disabled:opacity-30"><ChevronDownIcon /></button>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 flex items-center gap-2">
                            {item.label}
                            {!item.isVisible && <EyeOff className="w-3.5 h-3.5 text-amber-500" />}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">{item.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(item)} className="p-1.5 text-slate-400 hover:text-primary rounded-md"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-md"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    {/* Children */}
                    {item.children && item.children.length > 0 && (
                      <div className="bg-slate-50 border-t border-slate-200 p-3 pl-12 space-y-2">
                        {item.children.map((child: any) => (
                          <div key={child.id} className="flex items-center justify-between p-2 border border-slate-200 rounded-md bg-white">
                            <div>
                              <p className="text-sm font-medium text-slate-900">{child.label}</p>
                              <p className="text-[10px] text-slate-500">{child.url}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleEdit(child)} className="p-1 text-slate-400 hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDelete(child.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Modal */}
        {isAdding && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-4 border-b flex items-center justify-between shrink-0">
                <h3 className="font-semibold text-lg">{editingItem ? "Edit Menu Item" : "Add Menu Item"}</h3>
                <button onClick={resetForm} className="text-slate-400 hover:text-slate-700">&times;</button>
              </div>
              <div className="p-4 overflow-y-auto space-y-4">
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Label</label>
                  <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} required className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g., About Us" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">URL</label>
                  <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} required className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g., /about" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Parent Item (Optional)</label>
                  <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="">-- None (Top Level) --</option>
                    {items.filter((i:any) => i.id !== editingItem?.id).map((i:any) => (
                      <option key={i.id} value={i.id}>{i.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="text-sm font-medium text-slate-700">Visibility</label>
                  <select value={authVisibility} onChange={(e) => setAuthVisibility(e.target.value)} className="border rounded-md px-2 py-1 text-sm">
                    <option value="EVERYONE">Everyone</option>
                    <option value="LOGGED_IN">Logged In Only</option>
                    <option value="LOGGED_OUT">Logged Out Only</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="isVisible" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} className="rounded" />
                  <label htmlFor="isVisible" className="text-sm text-slate-700">Publicly visible</label>
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="openInNew" checked={openInNew} onChange={(e) => setOpenInNew(e.target.checked)} className="rounded" />
                  <label htmlFor="openInNew" className="text-sm text-slate-700">Open in new tab</label>
                </div>
              </div>

              <div className="p-4 border-t shrink-0 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
                <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90">
                  {editingItem ? "Save Changes" : "Add Item"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
      </div>
    </div>
  );
}

const ChevronUpIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.18179 8.81819C4.00605 8.99392 3.72113 8.99392 3.54539 8.81819C3.36965 8.64245 3.36965 8.35753 3.54539 8.18179L7.18179 4.54539C7.26618 4.461 7.38064 4.41355 7.50009 4.41355C7.61954 4.41355 7.734 4.461 7.81839 4.54539L11.4548 8.18179C11.6305 8.35753 11.6305 8.64245 11.4548 8.81819C11.279 8.99392 10.9941 8.99392 10.8184 8.81819L7.50009 5.49987L4.18179 8.81819Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
);
const ChevronDownIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.18179 6.18181C3.90564 5.90566 3.45785 5.90566 3.18171 6.18181C2.90556 6.45795 2.90556 6.90575 3.18171 7.18189L7.00004 11.0002C7.13264 11.1328 7.31252 11.2073 7.50004 11.2073C7.68755 11.2073 7.86744 11.1328 8.00004 11.0002L11.8184 7.18189C12.0945 6.90575 12.0945 6.45795 11.8184 6.18181C11.5422 5.90566 11.0945 5.90566 10.8184 6.18181L7.50004 9.49999L4.18179 6.18181Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
);
