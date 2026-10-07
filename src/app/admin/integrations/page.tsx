import { Layers, CheckCircle, RefreshCw, Key, ShieldCheck, Settings } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminIntegrations() {
  const integrations = [
    { name: "bKash Merchant Gateway", category: "Payment", status: "Connected", description: "Real-time automated mobile banking payment verification" },
    { name: "Nagad API Gateway", category: "Payment", status: "Connected", description: "Instant Nagad transaction verification & instant fulfillment" },
    { name: "Rocket Gateway", category: "Payment", status: "Connected", description: "Dutch-Bangla Bank Rocket mobile payments API" },
    { name: "Upay Gateway", category: "Payment", status: "Connected", description: "UCB Upay automated merchant gateway" },
    { name: "Stripe International", category: "Payment", status: "Configured", description: "Credit / Debit card processing (USD / EUR / GBP)" },
    { name: "Cryptocurrency (BTCPay)", category: "Payment", status: "Configured", description: "Decentralized crypto payment processing (USDT, BTC, ETH)" },
    { name: "SendGrid SMTP", category: "Email", status: "Connected", description: "High-deliverability transactional email service" },
    { name: "Telegram Notification Bot", category: "Alerts", status: "Connected", description: "Instant admin alerts on new orders & payment receipts" },
    { name: "Google Analytics 4 & Pixel", category: "Analytics", status: "Connected", description: "E-commerce tracking & conversion pixel data" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">App & API Integrations</h1>
          <p className="text-slate-500 mt-1">Manage third-party payment gateways, email SMTP, bots, and analytics</p>
        </div>
        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm flex items-center gap-2">
          <Key className="w-4 h-4" /> Manage API Keys
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {integrations.map((item, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded-md">
                  {item.category}
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" /> {item.status}
                </span>
              </div>
              <h3 className="font-semibold text-slate-900">{item.name}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Webhook verified
              </span>
              <button className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1">
                <Settings className="w-3.5 h-3.5" /> Configure
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
