import { prisma } from "@/lib/prisma";
import { AlertCircle } from "lucide-react";
import PaymentSettingsForm from "./PaymentSettingsForm";

export const dynamic = "force-dynamic";

// Seed default configs if they don't exist
async function ensureDefaultPaymentMethods() {
  const defaults = [
    { code: "UPI", displayName: "UPI Payment", sortOrder: 1 },
    { code: "BTC", displayName: "Bitcoin (BTC)", sortOrder: 2 },
    { code: "USDT", displayName: "USDT / TRC20", sortOrder: 3 },
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
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Payment Settings</h1>
        <p className="text-slate-500 mt-1">Configure manual payment methods for your store.</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-900 text-sm">Manual Mode Configuration</p>
          <p className="text-amber-800 text-sm mt-1">
            These payment methods operate in MANUAL mode. Orders remain ON_HOLD until you verify the payment and approve it from the Admin panel. Automatic gateway integration is disabled.
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
