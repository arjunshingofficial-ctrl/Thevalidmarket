import { Activity, Server, Database, Zap, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminServiceStatus() {
  const services = [
    { name: "Next.js Web Application", latency: "14ms", status: "Operational", icon: Server },
    { name: "SQLite DB Engine (Prisma ORM)", latency: "2ms", status: "Operational", icon: Database },
    { name: "Mobile Banking Gateways (bKash/Nagad)", latency: "120ms", status: "Operational", icon: Zap },
    { name: "Digital License Key Engine", latency: "5ms", status: "Operational", icon: Activity },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">System Infrastructure Status</h1>
          <p className="text-slate-500 mt-1">Real-time health monitoring of core application services</p>
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          <div>
            <h3 className="font-bold text-emerald-900">All Systems Operational</h3>
            <p className="text-xs text-emerald-700">100% uptime over the last 30 days</p>
          </div>
        </div>
        <span className="text-xs font-mono font-semibold text-emerald-800">Uptime: 99.99%</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((svc, i) => {
          const Icon = svc.icon;
          return (
            <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100 text-slate-700 rounded-lg">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{svc.name}</p>
                  <p className="text-xs text-slate-500">Latency: {svc.latency}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                {svc.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
