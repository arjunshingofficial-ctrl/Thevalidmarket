import { prisma } from "@/lib/prisma";
import { AlertCircle } from "lucide-react";
import PaymentSettingsForm from "./PaymentSettingsForm";

export const dynamic = "force-dynamic";

// Seed default configs if they don't exist
async function ensureDefaultPaymentMethods() {
  const defaults = [
    {
      code: "UPI",
      displayName: "Instant UPI (PhonePe, GPay, Paytm, QR)",
      sortOrder: 1,
      isEnabled: true,
      mode: "AUTOMATIC",
      instructions: "Pay instantly with any UPI app (Google Pay, PhonePe, Paytm, BHIM, etc.).",
      settings: JSON.stringify({
        gatewayMode: "BLADEPAY",
        bladePayBaseUrl: "https://api.silkpay.live",
        bladePayMerchantCode: "MCH-SILKPAY",
        bladePayToken: "gw_35481ca3b7132868cf94fb507fbce30ab540b98912697c3f24a753594471804c",
      }),
    },
    {
      code: "UPI_MANUAL",
      displayName: "Manual UPI (Static QR & Transfer)",
      sortOrder: 2,
      isEnabled: false,
      mode: "MANUAL",
      instructions: "Scan the static UPI QR code or transfer to UPI ID and submit your UTR.",
      settings: JSON.stringify({
        vpa: "example@upi",
        receiverName: "Business Name",
        upiPaymentMode: "DIRECT_SUPPORT",
      }),
    },
    { code: "BTC", displayName: "Bitcoin (BTC)", sortOrder: 3 },
    { code: "USDT", displayName: "USDT / TRC20", sortOrder: 4 },
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
    orderBy: { sortOrder: "asc" }
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Payment Gateway Settings</h1>
        <p className="text-slate-500 mt-1">Configure automated UPI gateways (BladePay) and manual crypto methods.</p>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-emerald-900 text-sm">Automated UPI Gateway Enabled</p>
          <p className="text-emerald-800 text-sm mt-1">
            UPI is configured with BladePay automated checkout. Customers can scan QR or pay with GPay, PhonePe, or Paytm. BladePay sends real-time MD5 signed webhooks to fulfill digital goods instantly.
          </p>
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
