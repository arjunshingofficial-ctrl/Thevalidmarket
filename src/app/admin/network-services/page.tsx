import { prisma } from "@/lib/prisma";
import { Server } from "lucide-react";
import { requireAdmin } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminNetworkServices() {
  await requireAdmin("NetworkServices", "View");

  const locations = await prisma.vpnLocation.findMany({
    orderBy: { country: "asc" }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Network Services</h1>
          <p className="text-slate-500 mt-1">Manage VPN and Proxy locations.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 border-b">
            <tr>
              <th className="px-6 py-4 font-semibold">Location</th>
              <th className="px-6 py-4 font-semibold">Country Code</th>
              <th className="px-6 py-4 font-semibold">Servers</th>
              <th className="px-6 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {locations.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                  <Server className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <p className="font-medium text-slate-900">No locations configured</p>
                </td>
              </tr>
            ) : (
              locations.map(loc => (
                <tr key={loc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {loc.city ? `${loc.city}, ` : ''}{loc.country}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-500">{loc.countryCode}</td>
                  <td className="px-6 py-4 text-slate-600">{loc.serverCount}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      loc.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" :
                      "bg-slate-100 text-slate-700"
                    }`}>
                      {loc.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
