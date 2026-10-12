import { MapPin, Plus, Globe, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminLocations() {
  const regions = [
    { name: "Global International (Primary)", currency: "USD ($)", status: "Active", defaultGateways: "Stripe, Crypto, Cards, PayPal" },
    { name: "Bangladesh & South Asia", currency: "BDT (৳) / USD", status: "Active", defaultGateways: "bKash, Nagad, Rocket, Upay" },
    { name: "India & Regional", currency: "INR (₹) / USD", status: "Active", defaultGateways: "UPI, Cards, Crypto" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Regional & Location Settings</h1>
          <p className="text-slate-500 mt-1">Manage GEO target regions, currency rules, and regional gateway routing</p>
        </div>
        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Region Rule
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {regions.map((reg, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Globe className="w-5 h-5" />
              </span>
              <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                {reg.status}
              </span>
            </div>
            <h3 className="font-semibold text-slate-900 text-lg">{reg.name}</h3>
            <div className="text-xs text-slate-600 space-y-1">
              <p><strong className="text-slate-700">Currency:</strong> {reg.currency}</p>
              <p><strong className="text-slate-700">Gateways:</strong> {reg.defaultGateways}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
