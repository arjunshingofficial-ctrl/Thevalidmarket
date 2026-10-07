"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Bitcoin, BadgeDollarSign } from "lucide-react";

const icons: Record<string, React.ElementType> = {
  UPI: CreditCard,
  BTC: Bitcoin,
  USDT: BadgeDollarSign,
};

export default function PaymentSettingsForm({ method }: { method: any }) {
  const router = useRouter();
  const settings = method.settings ? JSON.parse(method.settings) : {};
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // States for preview
  const [upiMode, setUpiMode] = useState(settings.upiPaymentMode || "DIRECT_SUPPORT");
  const [upiId, setUpiId] = useState(settings.vpa || "");

  const Icon = icons[method.code] || CreditCard;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    // Package settings into JSON string
    const newSettings: any = {};
    formData.forEach((value, key) => {
      if (key.startsWith("setting_")) {
        const settingKey = key.replace("setting_", "");
        if (value === "true") newSettings[settingKey] = true;
        else if (value === "false") newSettings[settingKey] = false;
        else newSettings[settingKey] = value;
      }
    });

    if (method.code === "UPI") {
      const mode = newSettings.upiPaymentMode || "DIRECT_SUPPORT";
      const vpa = (newSettings.vpa || "").trim();
      if ((mode === "DIRECT" || mode === "DIRECT_SUPPORT") && !vpa) {
         setError("Direct UPI mode requires a valid UPI ID (VPA).");
         setSaving(false);
         return;
      }
    }

    formData.set("settings", JSON.stringify(newSettings));
    
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to save settings");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className={`p-5 border-b flex items-center justify-between ${method.isEnabled ? "bg-emerald-50 border-emerald-100" : "bg-slate-50"}`}>
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-lg ${method.isEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{method.displayName}</h3>
            <span className="text-xs text-slate-500 font-medium">MODE: {method.mode}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${method.isEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
            {method.isEnabled ? "Enabled" : "Disabled"}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <input type="hidden" name="id" value={method.id} />
        <input type="hidden" name="mode" value="MANUAL" />
        
        {error && (
          <div className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Display Name</label>
            <input name="displayName" defaultValue={method.displayName} required
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Customer Instructions</label>
            <textarea name="instructions" rows={2} defaultValue={method.instructions || ""}
              placeholder="E.g. Please scan the QR code and complete the payment."
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          </div>
        </div>

        <div className="pt-4 border-t space-y-4">
          <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">{method.code} specific settings</h4>

          {method.code === "UPI" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">UPI ID / VPA *</label>
                  <input name="setting_vpa" value={upiId} onChange={e => setUpiId(e.target.value)} required={upiMode !== "SUPPORT"}
                    placeholder="example@upi"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Receiver Name</label>
                  <input name="setting_receiverName" defaultValue={settings.receiverName || ""}
                    placeholder="Business Name"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Manual Payment Support</h4>
                
                <div className="space-y-4 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">UPI Payment Mode</label>
                    <select name="setting_upiPaymentMode" value={upiMode} onChange={e => setUpiMode(e.target.value)}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <option value="DIRECT">Direct Only (Show QR/ID)</option>
                      <option value="SUPPORT">Support Only (Hide QR/ID, show buttons)</option>
                      <option value="DIRECT_SUPPORT">Direct + Support (Show both)</option>
                    </select>
                  </div>
                </div>

                <div className="mb-6 p-4 bg-slate-100 rounded-lg border border-slate-200">
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Customer View Preview</h5>
                  <div className="text-sm text-slate-700 space-y-1">
                    {upiMode === "DIRECT" && <div><span className="font-semibold">QR Code</span> + <span className="font-semibold">UPI ID ({upiId || "Missing"})</span></div>}
                    {upiMode === "SUPPORT" && <div><span className="font-semibold">WhatsApp & Telegram Support Buttons</span> Only</div>}
                    {upiMode === "DIRECT_SUPPORT" && <div><span className="font-semibold">QR Code</span> + <span className="font-semibold">UPI ID ({upiId || "Missing"})</span> + <span className="font-semibold">Support Buttons</span></div>}
                    {(upiMode === "DIRECT" || upiMode === "DIRECT_SUPPORT") && !upiId && (
                      <div className="text-red-600 font-medium text-xs mt-1">Warning: Missing UPI ID will automatically fall back to Support Only mode for customers.</div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* WhatsApp Config */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold text-slate-800 flex items-center gap-2">
                        WhatsApp Support
                      </h5>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="setting_whatsappSupportEnabled" value="true" defaultChecked={settings.whatsappSupportEnabled === true}
                          className="rounded border-slate-300 text-primary focus:ring-primary" />
                        <span className="text-sm font-medium">Enabled</span>
                      </label>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">WhatsApp Number</label>
                      <input name="setting_whatsappNumber" defaultValue={settings.whatsappNumber || ""}
                        placeholder="+919876543210"
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      <p className="text-xs text-slate-500">Must include country code (e.g., +91)</p>
                    </div>
                  </div>

                  {/* Telegram Config */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold text-slate-800 flex items-center gap-2">
                        Telegram Support
                      </h5>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="setting_telegramSupportEnabled" value="true" defaultChecked={settings.telegramSupportEnabled === true}
                          className="rounded border-slate-300 text-primary focus:ring-primary" />
                        <span className="text-sm font-medium">Enabled</span>
                      </label>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Telegram Username</label>
                      <input name="setting_telegramUsername" defaultValue={settings.telegramUsername || ""}
                        placeholder="@AsiaDMarketSupport"
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      <p className="text-xs text-slate-500">Include the @ symbol</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {method.code === "BTC" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Bitcoin Address *</label>
                  <input name="setting_btcAddress" defaultValue={settings.btcAddress || ""} required
                    placeholder="1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Network</label>
                  <input readOnly value="Bitcoin Mainnet"
                    className="w-full border rounded-md px-3 py-2 text-sm bg-slate-50 text-slate-500 cursor-not-allowed" />
                  <input type="hidden" name="setting_network" value="Bitcoin Mainnet" />
                </div>
              </div>
            </>
          )}

          {method.code === "USDT" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">USDT Wallet Address *</label>
                  <input name="setting_usdtAddress" defaultValue={settings.usdtAddress || ""} required
                    placeholder="TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Network</label>
                  <select name="setting_network" defaultValue={settings.network || "TRC20"}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="TRC20">TRC20</option>
                    <option value="ERC20">ERC20</option>
                    <option value="BEP20">BEP20</option>
                    <option value="Polygon">Polygon</option>
                  </select>
                  <p className="text-xs text-slate-500">Checkout must clearly show this network.</p>
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="setting_requireTransactionId" value="true" defaultChecked={settings.requireTransactionId !== false}
                  className="rounded border-slate-300 text-primary focus:ring-primary" />
                <span className="text-sm text-slate-700">Require Transaction ID / Hash</span>
              </label>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="setting_requireProof" value="true" defaultChecked={settings.requireProof !== false}
                  className="rounded border-slate-300 text-primary focus:ring-primary" />
                <span className="text-sm text-slate-700">Require Payment Proof (Screenshot)</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-md border">
            <input type="checkbox" name="isEnabled" value="true" defaultChecked={method.isEnabled}
              className="rounded border-slate-300 text-primary focus:ring-primary" />
            <span className="text-sm text-slate-700 font-medium">Enable Payment Method</span>
          </label>
          <button type="submit" disabled={saving}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
            {saving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </form>
    </div>
  );
}
