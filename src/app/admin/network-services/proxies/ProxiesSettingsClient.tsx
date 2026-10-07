"use client";

import { useState } from "react";
import { Key, Save, Server, Shield } from "lucide-react";
import { updateProxyLicenses } from "@/lib/actions/admin";

interface ProxyData {
  id: string;
  name: string;
  platform: string;
  staticLicense: string;
}

export default function ProxiesSettingsClient({ initialData }: { initialData: ProxyData[] }) {
  const [proxies, setProxies] = useState<ProxyData[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleChange = (id: string, value: string) => {
    setProxies(proxies.map(p => p.id === id ? { ...p, staticLicense: value } : p));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setMessage(null);
      await updateProxyLicenses(proxies.map(p => ({ id: p.id, staticLicense: p.staticLicense })));
      setMessage({ text: "Static licenses saved successfully. All future purchases will receive these exact keys.", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to save licenses", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Server className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-800">Global Proxy Configurations</h2>
        </div>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isLoading ? "Saving..." : "Save Configuration"}
        </button>
      </div>

      <div className="p-6 space-y-6">
        {message && (
          <div className={`p-4 rounded-lg text-sm font-medium flex items-center gap-2 ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            <Shield className="w-4 h-4" />
            {message.text}
          </div>
        )}

        <div className="grid gap-6">
          {proxies.map(proxy => (
            <div key={proxy.id} className="border rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <Key className="w-4 h-4 text-slate-400" />
                <h3 className="font-semibold text-slate-800">{proxy.name}</h3>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Static License / Credentials String</label>
                <textarea
                  value={proxy.staticLicense}
                  onChange={(e) => handleChange(proxy.id, e.target.value)}
                  placeholder="e.g. IP: 192.168.1.1, Port: 1080, User: admin, Pass: 1234"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none h-24 font-mono text-sm"
                />
                <p className="text-xs text-slate-500">This exact text will be displayed to all users who purchase this product.</p>
              </div>
            </div>
          ))}
          
          {proxies.length === 0 && (
            <div className="text-center p-8 text-slate-500">
              No Socks 5 proxy products found in the database. Ensure you have seeded the products.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
