import { Shield, Plus, Check, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminRoles() {
  const roles = [
    { name: "SUPER_ADMIN", desc: "Full root access to all settings, DB models, payouts, and system config", members: 1, permissions: ["*"] },
    { name: "ADMIN", desc: "Access to store management, orders, products, blog, and support tickets", members: 3, permissions: ["products.*", "orders.*", "blog.*", "customers.read"] },
    { name: "SUPPORT", desc: "Access to view orders, respond to tickets, and assist customers", members: 5, permissions: ["orders.read", "tickets.*", "customers.read"] },
    { name: "CUSTOMER", desc: "Default account access for purchasing products and managing downloads", members: 1420, permissions: ["orders.own", "downloads.own"] },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">RBAC Roles & Permissions</h1>
          <p className="text-slate-500 mt-1">Configure user roles and granular administrative permission scopes</p>
        </div>
        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Custom Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((r, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="px-2.5 py-1 text-xs font-mono font-bold bg-slate-100 text-slate-800 rounded-md">
                  {r.name}
                </span>
                <p className="text-xs text-slate-500 mt-2">{r.desc}</p>
              </div>
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {r.members} Users
              </span>
            </div>
            <div className="pt-3 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-700">Permissions Scopes:</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {r.permissions.map((p, idx) => (
                  <span key={idx} className="px-2 py-0.5 text-xs font-mono bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
