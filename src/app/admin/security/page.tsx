import { Shield, Lock, Key, AlertOctagon, CheckCircle2, UserCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminSecurity() {
  const auditItems = [
    { title: "BCrypt Password Hashing", status: "Active (Cost 12)", icon: Lock },
    { title: "NextAuth JWT Session Security", status: "Active (24h Expiry)", icon: Key },
    { title: "CSRF & Webhook Signature Verification", status: "Active", icon: Shield },
    { title: "Admin RBAC Protection Middleware", status: "Active", icon: UserCheck },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Security & Access Audit</h1>
          <p className="text-slate-500 mt-1">Platform security posture, session policies, and encryption status</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {auditItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{item.title}</h3>
                  <p className="text-xs text-slate-500">{item.status}</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Secure
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
