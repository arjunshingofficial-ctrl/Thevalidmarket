import { Mail, Plus, Send, CheckCircle2, FileCode } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminEmailTemplates() {
  const templates = [
    { id: "1", name: "Order Confirmation & Invoice", trigger: "Order Completed", status: "Active", updated: "2026-09-28" },
    { id: "2", name: "Instant Digital License Delivery", trigger: "Payment Verified", status: "Active", updated: "2026-09-30" },
    { id: "3", name: "Welcome New Customer", trigger: "Account Registered", status: "Active", updated: "2026-10-01" },
    { id: "4", name: "Password Reset Code", trigger: "Auth Forgot Password", status: "Active", updated: "2026-10-02" },
    { id: "5", name: "Abandoned Cart Reminder", trigger: "Cart Inactive 24h", status: "Draft", updated: "2026-09-15" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Email & Notification Templates</h1>
          <p className="text-slate-500 mt-1">Configure automated transactional emails and customer notifications</p>
        </div>
        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Template
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Mail className="w-4 h-4 text-emerald-600" /> Transactional Templates ({templates.length})
          </h2>
        </div>
        <div className="divide-y divide-slate-200">
          {templates.map((tpl) => (
            <div key={tpl.id} className="p-4 hover:bg-slate-50 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{tpl.name}</h3>
                  <p className="text-xs text-slate-500">Trigger: {tpl.trigger} • Last edited: {tpl.updated}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                  tpl.status === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                }`}>
                  {tpl.status}
                </span>
                <button className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg">
                  Edit Markup
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
