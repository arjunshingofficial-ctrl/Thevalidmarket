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
  ShieldCheck,
} from "lucide-react";

const icons: Record<string, React.ElementType> = {
  UPI: Zap,
  UPI_MANUAL: CreditCard,
  BTC: Bitcoin,
  USDT: BadgeDollarSign,
};

export default function PaymentSettingsForm({ method }: { method: any }) {
  const router = useRouter();
  const settings = method.settings ? JSON.parse(method.settings) : {};

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States for Manual UPI
  const [upiMode, setUpiMode] = useState(settings.upiPaymentMode || "DIRECT_SUPPORT");
  const [upiId, setUpiId] = useState(settings.vpa || "");
  const [gatewayMode, setGatewayMode] = useState<"MANUAL" | "BLADEPAY">(
    settings.gatewayMode || (method.mode === "AUTOMATIC" ? "BLADEPAY" : "MANUAL")
  );

  // BladePay Live Balance & Diagnostics
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
    const url = `${origin || "https://asiadmarket.com"}/api/webhooks/bladepay`;
    navigator.clipboard.writeText(url);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  const fetchBladePayBalance = async () => {
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

    if (method.code === "UPI") {
      newSettings.gatewayMode = gatewayMode;
      formData.set("mode", gatewayMode === "BLADEPAY" ? "AUTOMATIC" : "MANUAL");
    } else if (method.code === "UPI_MANUAL") {
      newSettings.gatewayMode = "MANUAL";
      formData.set("mode", "MANUAL");

      const mode = newSettings.upiPaymentMode || "DIRECT_SUPPORT";
      const vpa = (newSettings.vpa || "").trim();
      if ((mode === "DIRECT" || mode === "DIRECT_SUPPORT") && !vpa) {
        setError("Direct UPI mode requires a valid UPI ID (VPA).");
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
              MODE: {method.code === "UPI" ? (gatewayMode === "BLADEPAY" ? "AUTOMATIC (BLADEPAY)" : "MANUAL (DIRECT UPI QR)") : method.mode}
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
            {method.code === "UPI"
              ? "BladePay Gateway Settings"
              : method.code === "UPI_MANUAL"
              ? "Manual UPI & QR Settings"
              : `${method.code} specific settings`}
          </h4>

          {/* UPI Gateway Mode & Dual Configuration */}
          {method.code === "UPI" && (
            <div className="space-y-6">
              {/* Mode Selection */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    UPI Processing Mode
                  </label>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Switch between Direct Transfer or Automated Gateway
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                      gatewayMode === "MANUAL"
                        ? "border-emerald-500 bg-emerald-50/70 text-emerald-950 font-medium ring-1 ring-emerald-500"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="gatewayModeSelection"
                      value="MANUAL"
                      checked={gatewayMode === "MANUAL"}
                      onChange={() => setGatewayMode("MANUAL")}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-sm font-semibold flex items-center gap-1.5">
                        <span>Direct UPI (QR & VPA)</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                          Recommended / 100% Uptime
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Customer scans auto-generated UPI QR or copies UPI ID and submits 12-digit UTR.
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                      gatewayMode === "BLADEPAY"
                        ? "border-primary bg-primary/5 text-slate-900 font-medium ring-1 ring-primary"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="gatewayModeSelection"
                      value="BLADEPAY"
                      checked={gatewayMode === "BLADEPAY"}
                      onChange={() => setGatewayMode("BLADEPAY")}
                      className="mt-0.5 text-primary focus:ring-primary"
                    />
                    <div>
                      <div className="text-sm font-semibold flex items-center gap-1.5">
                        <span>BladePay Automated</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                          Auto-Cashier
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Redirects customer to BladePay cashier and verifies via webhook. (Auto-falls back to Direct UPI if offline).
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Direct UPI Transfer Settings (Always available as active mode or auto-fallback) */}
              <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-emerald-600" />
                    <h5 className="font-semibold text-sm text-slate-900">
                      Direct UPI Destination Details {gatewayMode === "BLADEPAY" && <span className="text-xs text-slate-500 font-normal">(Used for Instant Fallback)</span>}
                    </h5>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-700 font-medium px-2.5 py-0.5 rounded">
                    QR Code & VPA
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">UPI ID / VPA *</label>
                    <input
                      name="setting_vpa"
                      defaultValue={settings.vpa || ""}
                      placeholder="e.g. yourname@okaxis, merchant@upi"
                      className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <p className="text-[11px] text-slate-500">The UPI ID where customer funds are sent.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Receiver / Payee Name</label>
                    <input
                      name="setting_receiverName"
                      defaultValue={settings.receiverName || ""}
                      placeholder="e.g. The Valid Market"
                      className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <p className="text-[11px] text-slate-500">Official business or payee name encoded into the UPI QR.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Manual UPI Display Mode</label>
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
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
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
                      className="w-full border rounded-md px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
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
                      placeholder="https://t.me/+xpN22t7nSkk4ZWJl or @username"
                      className="w-full border rounded-md px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
              </div>

              {/* BladePay Automated UPI Configuration */}
              <div className={`p-5 rounded-xl border space-y-4 ${gatewayMode === "BLADEPAY" ? "bg-emerald-50/50 border-emerald-200" : "bg-slate-50 border-slate-200 opacity-90"}`}>
                <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    <h5 className="font-semibold text-sm text-emerald-950">
                      BladePay Gateway Credentials
                    </h5>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
                    Auto Webhook & Cashier
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">BladePay API Base URL</label>
                    <input
                      name="setting_bladePayBaseUrl"
                      defaultValue={settings.bladePayBaseUrl || "https://api.bladepay.pro"}
                      className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Merchant Code</label>
                    <input
                      name="setting_bladePayMerchantCode"
                      defaultValue={settings.bladePayMerchantCode || "MCH-20261026-5480"}
                      className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Bearer API Token</label>
                  <input
                    name="setting_bladePayToken"
                    type="password"
                    defaultValue={settings.bladePayToken || "gw_5bb3b36ca2c30c2e6793bf8fe275f9bdedc668c707557b61358bc993d04d8b1a"}
                    className="w-full border rounded-md px-3 py-2 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <p className="text-xs text-slate-500">
                    Used for Bearer authorization on payin creation and balance queries.
                  </p>
                </div>

                {/* Webhook Endpoint */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      BladePay Webhook URL (For Real-time Callback)
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyWebhook}
                      className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                    >
                      {copiedWebhook ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copy Webhook URL
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border text-xs font-mono text-slate-800 break-all select-all">
                    {origin || "https://asiadmarket.com"}/api/webhooks/bladepay
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Set this in your BladePay merchant dashboard. Signatures are automatically verified using MD5 and acknowledged with raw &quot;SUCCESS&quot;.
                  </p>
                </div>

                {/* Live Balance Checker */}
                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={fetchBladePayBalance}
                    disabled={loadingBalance}
                    className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingBalance ? "animate-spin" : ""}`} />
                    {loadingBalance ? "Querying BladePay..." : "Check Live BladePay Balance"}
                  </button>

                  {balanceData && (
                    <div className="text-xs">
                      {balanceData.success ? (
                        <div className="flex items-center gap-3 font-medium text-emerald-800 bg-emerald-100 px-3 py-1 rounded-md">
                          <span>Available: ₹{balanceData.availableBalance?.toFixed(2) || "0.00"}</span>
                          <span>Pending: ₹{balanceData.pendingBalance?.toFixed(2) || "0.00"}</span>
                        </div>
                      ) : (
                        <span className="text-red-600 font-medium">
                          {balanceData.error || "Failed to load balance"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Manual UPI Configuration */}
          {method.code === "UPI_MANUAL" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">UPI ID / VPA *</label>
                  <input
                    name="setting_vpa"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    required={upiMode !== "SUPPORT"}
                    placeholder="example@upi"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Receiver Name</label>
                  <input
                    name="setting_receiverName"
                    defaultValue={settings.receiverName || ""}
                    placeholder="Business Name"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Manual UPI Display Mode
                  </label>
                  <select
                    name="setting_upiPaymentMode"
                    value={upiMode}
                    onChange={(e) => setUpiMode(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="DIRECT">Direct Only (Show QR/ID)</option>
                    <option value="SUPPORT">Support Only (Hide QR/ID, show buttons)</option>
                    <option value="DIRECT_SUPPORT">Direct + Support (Show both)</option>
                  </select>
                </div>
              </div>

              {/* WhatsApp & Telegram */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* WhatsApp Config */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-slate-800 flex items-center gap-2">
                      WhatsApp Support
                    </h5>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="setting_whatsappSupportEnabled"
                        value="true"
                        defaultChecked={settings.whatsappSupportEnabled === true}
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium">Enabled</span>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      WhatsApp Number
                    </label>
                    <input
                      name="setting_whatsappNumber"
                      defaultValue={settings.whatsappNumber || ""}
                      placeholder="+919876543210"
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <p className="text-xs text-slate-500">
                      Must include country code (e.g., +91)
                    </p>
                  </div>
                </div>

                {/* Telegram Config */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-slate-800 flex items-center gap-2">
                      Telegram Support
                    </h5>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="setting_telegramSupportEnabled"
                        value="true"
                        defaultChecked={settings.telegramSupportEnabled === true}
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium">Enabled</span>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Telegram Username or Group Link
                    </label>
                    <input
                      name="setting_telegramUsername"
                      defaultValue={settings.telegramUsername || ""}
                      placeholder="https://t.me/+xpN22t7nSkk4ZWJl or @username"
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <p className="text-xs text-slate-500">Invite link or @username. Defaults to https://t.me/+xpN22t7nSkk4ZWJl if empty.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {method.code === "BTC" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Bitcoin Address *</label>
                <input
                  name="setting_btcAddress"
                  defaultValue={settings.btcAddress || ""}
                  required
                  placeholder="1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
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

          {method.code === "USDT" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  USDT Wallet Address *
                </label>
                <input
                  name="setting_usdtAddress"
                  defaultValue={settings.usdtAddress || ""}
                  required
                  placeholder="TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Network</label>
                <select
                  name="setting_network"
                  defaultValue={settings.network || "TRC20"}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="TRC20">TRC20</option>
                  <option value="ERC20">ERC20</option>
                  <option value="BEP20">BEP20</option>
                  <option value="Polygon">Polygon</option>
                </select>
                <p className="text-xs text-slate-500">Checkout must clearly show this network.</p>
              </div>
            </div>
          )}

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
                <span className="text-sm text-slate-700">Require Transaction ID / Hash</span>
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
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-md border">
            <input
              type="checkbox"
              name="isEnabled"
              value="true"
              defaultChecked={method.isEnabled}
              className="rounded border-slate-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-slate-700 font-medium">
              Enable {method.displayName}
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
