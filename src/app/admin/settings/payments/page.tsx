import { prisma } from "@/lib/prisma";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import PaymentSettingsForm from "./PaymentSettingsForm";

export const dynamic = "force-dynamic";

// Seed default configs if they don't exist
async function ensureDefaultPaymentMethods() {
  const defaults = [
    {
      code: "SILKPAY",
      displayName: "SilkPay / SkillPay (Automated UPI Gateway)",
      sortOrder: 1,
      isEnabled: false,
      mode: "AUTOMATIC",
      instructions: "Pay instantly with any UPI app (Google Pay, PhonePe, Paytm, BHIM, CRED).",
      settings: JSON.stringify({
        silkPayBaseUrl: "https://api.silkpay.live",
        silkPayMerchantCode: "MCH-SILKPAY",
        silkPayToken: "gw_35481ca3b7132868cf94fb507fbce30ab540b98912697c3f24a753594471804c",
      }),
    },
    {
      code: "UPI",
      displayName: "UPI Payment Gateway (Direct QR & VPA)",
      sortOrder: 2,
      isEnabled: true,
      mode: "MANUAL",
      instructions: "Scan the UPI QR code or transfer to UPI ID (VPA) and submit your 12-digit UTR.",
      settings: JSON.stringify({
        vpa: "eqw@upi",
        receiverName: "The Valid Market",
        upiPaymentMode: "DIRECT_SUPPORT",
        whatsappSupportEnabled: true,
        whatsappNumber: "+916389458286",
        telegramSupportEnabled: true,
        telegramUsername: "https://t.me/+xpN22t7nSkk4ZWJl",
        requireTransactionId: true,
        requireProof: true,
      }),
    },
    { code: "BTC", displayName: "Bitcoin (BTC)", sortOrder: 3 },
    { code: "USDT", displayName: "USDT (TRC20)", sortOrder: 4 },
  ];

  for (const d of defaults) {
    await prisma.paymentMethodConfig.upsert({
      where: { code: d.code },
      update: {},
      create: d,
    });
  }
}

export default async function PaymentSettingsPage() {
  await ensureDefaultPaymentMethods();

  const paymentMethods = await prisma.paymentMethodConfig.findMany({
    where: {
      code: { in: ["SILKPAY", "UPI", "BTC", "USDT"] }
    },
    orderBy: { sortOrder: "asc" }
  });

  const silkPayMethod = paymentMethods.find(m => m.code === "SILKPAY");
  const upiMethod = paymentMethods.find(m => m.code === "UPI");

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Payment Gateway Settings</h1>
        <p className="text-slate-500 mt-1">
          SilkPay automated cashier gateway and Direct UPI payment gateway are separate. You can independently activate or deactivate each method.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${silkPayMethod?.isEnabled ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
          <div className={`p-2 rounded-lg ${silkPayMethod?.isEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">SilkPay Gateway</span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${silkPayMethod?.isEnabled ? "bg-emerald-200 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                {silkPayMethod?.isEnabled ? "Active" : "Disabled"}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Automated cashier link with instant dynamic UPI QR and MD5 signed webhooks via api.silkpay.live.
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-xl border flex items-start gap-3 ${upiMethod?.isEnabled ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
          <div className={`p-2 rounded-lg ${upiMethod?.isEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">UPI Payment Gateway</span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${upiMethod?.isEnabled ? "bg-emerald-200 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                {upiMethod?.isEnabled ? "Active" : "Disabled"}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Direct transfer to your UPI ID (VPA) with static/dynamic QR and manual 12-digit UTR confirmation.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {paymentMethods.map(method => (
          <PaymentSettingsForm key={method.id} method={method} />
        ))}
      </div>
    </div>
  );
}
