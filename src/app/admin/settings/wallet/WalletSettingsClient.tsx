"use client";

import { useState } from "react";
import { Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function WalletSettingsClient({ initialConfig }: any) {
  const router = useRouter();
  const [config, setConfig] = useState(initialConfig);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/settings/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });

      if (!res.ok) throw new Error("Failed to save settings");

      setMessage({ type: 'success', text: "Wallet settings saved successfully." });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 border-b pb-4">General Deposits</h2>
        
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
          <div>
            <h3 className="font-medium text-slate-900">Enable Wallet Deposits</h3>
            <p className="text-sm text-slate-500">Allow customers to add funds to their wallet.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={config.depositEnabled}
              onChange={(e) => setConfig({...config, depositEnabled: e.target.checked})}
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Deposit (USD)</label>
            <input 
              type="number" 
              value={config.minDeposit}
              onChange={(e) => setConfig({...config, minDeposit: Number(e.target.value)})}
              className="w-full px-3 py-2 rounded-lg border-slate-300 focus:border-primary focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Maximum Deposit (USD)</label>
            <input 
              type="number" 
              value={config.maxDeposit}
              onChange={(e) => setConfig({...config, maxDeposit: Number(e.target.value)})}
              className="w-full px-3 py-2 rounded-lg border-slate-300 focus:border-primary focus:ring-primary"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 border-b pb-4">Promotional Bonus</h2>
        
        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-100">
          <div>
            <h3 className="font-medium text-emerald-900">Enable Deposit Bonus</h3>
            <p className="text-sm text-emerald-800">Automatically grant bonus credit on deposits.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={config.bonusEnabled}
              onChange={(e) => setConfig({...config, bonusEnabled: e.target.checked})}
            />
            <div className="w-11 h-6 bg-emerald-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-100 transition-opacity" style={{ opacity: config.bonusEnabled ? 1 : 0.5, pointerEvents: config.bonusEnabled ? 'auto' : 'none' }}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bonus Rate (%)</label>
            <div className="relative">
              <input 
                type="number" 
                value={config.bonusRate}
                onChange={(e) => setConfig({...config, bonusRate: Number(e.target.value)})}
                className="w-full px-3 py-2 pr-8 rounded-lg border-slate-300 focus:border-primary focus:ring-primary"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">E.g. 100 = 100% bonus (Double deposit)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Maximum Bonus Cap (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <input 
                type="number" 
                value={config.maxBonus}
                onChange={(e) => setConfig({...config, maxBonus: Number(e.target.value)})}
                className="w-full pl-8 pr-3 py-2 rounded-lg border-slate-300 focus:border-primary focus:ring-primary"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Leave 0 for no limit.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Wallet Settings
        </button>
      </div>

    </form>
  );
}
