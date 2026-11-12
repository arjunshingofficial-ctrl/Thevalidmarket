"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Bitcoin,
  BadgeDollarSign,
  Zap,
  Check,
  Copy,
  RefreshCw,
  QrCode,
  ShieldCheck,
  AlertCircle,
  Smartphone,
} from "lucide-react";

const icons: Record<string, React.ElementType> = {
  SILKPAY: Zap,
  BLADEPAY: Zap,
  UPI: QrCode,
  UPI_MANUAL: CreditCard,
  BTC: Bitcoin,
  USDT: BadgeDollarSign,
};

export default function PaymentSettingsForm({ method }: { method: any }) {
  const router = useRouter();
  const settings = method.settings ? JSON.parse(method.settings) : {};

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // SilkPay Live Balance & Diagnostics
  const [balanceData, setBalanceData] = useState<any>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const Icon = icons[method.code] || CreditCard;

  const handleCopyWebhook = () => {
    const url = `${origin || "https://thevalidmarket.com"}/api/payin-webhook`;
    navigator.clipboard.writeText(url);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  const fetchSilkPayBalance = async () => {
    setLoadingBalance(true);
    try {
      const res = await fetch("/api/admin/payments/bladepay-balance");
      const data = await res.json();
      setBalanceData(data);
    } catch (e: any) {
      setBalanceData({ success: false, error: e.message });
    } finally {
      setLoadingBalance(false);
    }
  };

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

    if (method.code === "SILKPAY" || method.code === "BLADEPAY") {
      formData.set("mode", "AUTOMATIC");
    } else if (method.code === "UPI" || method.code === "UPI_MANUAL") {
      formData.set("mode", "MANUAL");
      const vpa = (newSettings.vpa || "").trim();
      const mode = newSettings.upiPaymentMode || "DIRECT_SUPPORT";
      if ((mode === "DIRECT" || mode === "DIRECT_SUPPORT") && !vpa && formData.get("isEnabled") === "true") {
        setError("Direct UPI mode requires a valid UPI ID (VPA) when enabled.");
        setSaving(false);
        return;
      }
    } else {
      formData.set("mode", method.mode || "MANUAL");
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

  const isSilkPay = method.code === "SILKPAY" || method.code === "BLADEPAY";
  const isDirectUpi = method.code === "UPI" || method.code === "UPI_MANUAL";

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div
        className={`p-5 border-b flex items-center justify-between ${
          method.isEnabled ? "bg-emerald-50 border-emerald-100" : "bg-slate-50"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`p-2.5 rounded-lg ${
              method.isEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{method.displayName}</h3>
            <span className="text-xs text-slate-500 font-medium">
              MODE: {isSilkPay ? "AUTOMATIC (SilkPay live cashier link)" : isDirectUpi ? "MANUAL (Direct Transfer & UTR)" : method.mode}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              method.isEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            {method.isEnabled ? "Active & Enabled" : "Disabled"}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <input type="hidden" name="id" value={method.id} />

        {error && (
          <div className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Display Name</label>
            <input
              name="displayName"
              defaultValue={method.displayName}
              required
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Customer Instructions</label>
            <textarea
              name="instructions"
              rows={2}
              defaultValue={method.instructions || ""}
              placeholder="Customer instructions shown at checkout..."
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
        </div>

        <div className="pt-4 border-t space-y-6">
          <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
            {isSilkPay
              ? "SilkPay / SkillPay Gateway Settings"
              : isDirectUpi
              ? "Direct UPI Transfer & QR Settings"
              : `${method.code} Specific Settings`}
          </h4>

          {/* SILKPAY GATEWAY SPECIFIC FORM */}
          {isSilkPay && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <h5 className="font-semibold text-sm text-slate-900">
                      SilkPay (SkillPay) API Authentication
                    </h5>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                    api.silkpay.live
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">API Base URL</label>
                    <input
                      name="setting_silkPayBaseUrl"
                      defaultValue={settings.silkPayBaseUrl || "https://api.silkpay.live"}
                      placeholder="https://api.silkpay.live"
                      className="w-full border rounded-md px-3 py-2 text-sm bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <p className="text-[11px] text-slate-500">Official SilkPay endpoint (e.g. https://api.silkpay.live).</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Merchant Code</label>
                    <input
                      name="setting_silkPayMerchantCode"
                      defaultValue={settings.silkPayMerchantCode || "MCH-SILKPAY"}
                      placeholder="e.g. MCH-SILKPAY"
                      className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <p className="text-[11px] text-slate-500">Your SilkPay merchant identifier.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Production Bearer API Token *</label>
                  <input
                    name="setting_silkPayToken"
                    type="password"
                    defaultValue={settings.silkPayToken || "gw_35481ca3b7132868cf94fb507fbce30ab540b98912697c3f24a753594471804c"}
                    placeholder="gw_..."
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <p className="text-[11px] text-slate-500">
                    Bearer token from SilkPay Settings &gt; API Credentials.
                  </p>
                </div>

                {/* Webhook Endpoint Box */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Webhook Notify URL</span>
                    <button
                      type="button"
                      onClick={handleCopyWebhook}
                      className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                    >
                      {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedWebhook ? "Copied!" : "Copy URL"}
                    </button>
                  </div>
                  <code className="text-xs text-slate-800 bg-slate-100 p-2 rounded block break-all font-mono select-all">
                    {origin ? `${origin}/api/payin-webhook` : "https://thevalidmarket.com/api/payin-webhook"}
                  </code>
                  <p className="text-[11px] text-slate-500">
                    SunPay / SilkPay sends instant signed HTTP POST callbacks with MD5 cryptographic signature to confirm transactions.
                  </p>
                </div>

                {/* Diagnostics & Live Balance Check */}
                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Gateway Connectivity &amp; Balance</div>
                    <div className="text-[11px] text-slate-500">
                      Query real-time wallet balance and check if API token is active.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={fetchSilkPayBalance}
                    disabled={loadingBalance}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingBalance ? "animate-spin" : ""}`} />
                    {loadingBalance ? "Checking..." : "Test Connection"}
                  </button>
                </div>

                {balanceData && (
                  <div
                    className={`p-3 rounded-lg text-xs border ${
                      balanceData.success
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                        : "bg-red-50 border-red-200 text-red-900"
                    }`}
                  >
                    {balanceData.success ? (
                      <div className="space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                          <Check className="w-4 h-4 text-emerald-600" /> Connection Successful!
                        </div>
                        <div>Available Balance: <strong>₹{balanceData.availableBalance?.toLocaleString() || "0"} INR</strong></div>
                        <div>Pending Balance: ₹{balanceData.pendingBalance?.toLocaleString() || "0"} INR</div>
                        <div>Merchant ID: <code className="font-mono text-[10px]">{balanceData.merchantId}</code></div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="font-bold text-red-800 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-red-600" /> Connection Failed
                        </div>
                        <div>Error: {balanceData.error || "Unable to reach SilkPay server"}</div>
                        {balanceData.status && <div>HTTP Status: {balanceData.status}</div>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DIRECT UPI TRANSFER SPECIFIC FORM */}
          {isDirectUpi && (
            <div className="space-y-5 p-5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  <h5 className="font-semibold text-sm text-slate-900">
                    Direct UPI Transfer (QR Code &amp; VPA)
                  </h5>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                  100% Uptime Rails
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">UPI ID / VPA *</label>
                  <input
                    name="setting_vpa"
                    defaultValue={settings.vpa || "eqw@upi"}
                    placeholder="e.g. yourname@okaxis, merchant@upi"
                    required={method.isEnabled}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <p className="text-[11px] text-slate-500">The UPI ID where customer funds are sent.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Receiver / Payee Name</label>
                  <input
                    name="setting_receiverName"
                    defaultValue={settings.receiverName || "The Valid Market"}
                    placeholder="e.g. The Valid Market"
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <p className="text-[11px] text-slate-500">Official business or payee name encoded into the UPI QR.</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Payment Flow Mode</label>
                <select
                  name="setting_upiPaymentMode"
                  defaultValue={settings.upiPaymentMode || "DIRECT_SUPPORT"}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="DIRECT_SUPPORT">Direct + Support (Show QR/ID and WhatsApp/Telegram buttons)</option>
                  <option value="DIRECT">Direct Only (Show QR and UPI ID only)</option>
                  <option value="SUPPORT">Support Only (Hide QR/ID, redirect to chat support)</option>
                </select>
              </div>

              {/* WhatsApp & Telegram Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">WhatsApp Support Contact</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        name="setting_whatsappSupportEnabled"
                        value="true"
                        defaultChecked={settings.whatsappSupportEnabled !== false}
                        className="rounded border-slate-300 text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                      <span className="text-xs font-medium text-slate-600">Enabled</span>
                    </label>
                  </div>
                  <input
                    name="setting_whatsappNumber"
                    defaultValue={settings.whatsappNumber || "+916389458286"}
                    placeholder="+916389458286"
                    className="w-full border rounded-md px-3 py-1.5 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Telegram Channel / Support</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        name="setting_telegramSupportEnabled"
                        value="true"
                        defaultChecked={settings.telegramSupportEnabled !== false}
                        className="rounded border-slate-300 text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                      <span className="text-xs font-medium text-slate-600">Enabled</span>
                    </label>
                  </div>
                  <input
                    name="setting_telegramUsername"
                    defaultValue={settings.telegramUsername || "https://t.me/+xpN22t7nSkk4ZWJl"}
                    placeholder="https://t.me/+..."
                    className="w-full border rounded-md px-3 py-1.5 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* BITCOIN SPECIFIC FORM */}
          {method.code === "BTC" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">BTC Wallet Address *</label>
                <input
                  name="setting_btcAddress"
                  defaultValue={settings.btcAddress || ""}
                  required={method.isEnabled}
                  placeholder="1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Network</label>
                <input
                  readOnly
                  value="Bitcoin Mainnet"
                  className="w-full border rounded-md px-3 py-2 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                />
                <input type="hidden" name="setting_network" value="Bitcoin Mainnet" />
              </div>
            </div>
          )}

          {/* USDT SPECIFIC FORM */}
          {method.code === "USDT" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">USDT Wallet Address *</label>
                <input
                  name="setting_usdtAddress"
                  defaultValue={settings.usdtAddress || ""}
                  required={method.isEnabled}
                  placeholder="TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Network</label>
                <select
                  name="setting_network"
                  defaultValue={settings.network || "TRC20"}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="TRC20">TRC20 (Tron)</option>
                  <option value="ERC20">ERC20 (Ethereum)</option>
                  <option value="BEP20">BEP20 (BNB Chain)</option>
                  <option value="Polygon">Polygon</option>
                </select>
              </div>
            </div>
          )}

          {/* Common Verification Settings for Manual / Direct Modes */}
          {!isSilkPay && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="setting_requireTransactionId"
                    value="true"
                    defaultChecked={settings.requireTransactionId !== false}
                    className="rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-slate-700">
                    {isDirectUpi ? "Require 12-digit UPI UTR Number" : "Require Transaction Hash / ID"}
                  </span>
                </label>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="setting_requireProof"
                    value="true"
                    defaultChecked={settings.requireProof !== false}
                    className="rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-slate-700">
                    Require Payment Proof (Screenshot)
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* ACTIVATION & SAVE FOOTER */}
        <div className="flex items-center justify-between pt-4 border-t">
          <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3.5 py-2 rounded-lg border hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              name="isEnabled"
              value="true"
              defaultChecked={method.isEnabled}
              className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
            />
            <span className="text-sm text-slate-800 font-semibold">
              Activate / Enable {method.displayName}
            </span>
          </label>
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </form>
    </div>
  );
}
