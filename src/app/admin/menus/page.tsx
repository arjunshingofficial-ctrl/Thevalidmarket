import { Navigation, Plus, MoveUp, MoveDown, Edit2, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminMenus() {
  const menus = [
    { id: "1", location: "Main Navigation Header", items: [
      { name: "Home", url: "/" },
      { name: "Store", url: "/store" },
      { name: "Courses", url: "/courses" },
      { name: "Services", url: "/services" },
      { name: "Blog", url: "/blog" },
      { name: "About Us", url: "/about" },
    ]},
    { id: "2", location: "Footer Quick Links", items: [
      { name: "Privacy Policy", url: "/privacy" },
      { name: "Terms of Service", url: "/terms" },
      { name: "Refund Policy", url: "/refund-policy" },
      { name: "Contact Us", url: "/contact" },
    ]},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Navigation & Menu Builder</h1>
          <p className="text-slate-500 mt-1">Configure header, footer, and sidebar navigation links</p>
        </div>
        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Menu Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {menus.map((menu) => (
          <div key={menu.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-600" /> {menu.location}
              </h2>
              <span className="text-xs text-slate-500">{menu.items.length} links</span>
            </div>
            <div className="divide-y divide-slate-100">
              {menu.items.map((item, idx) => (
                <div key={idx} className="p-3.5 hover:bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400 w-5">{idx + 1}.</span>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded">
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded">
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
