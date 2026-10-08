import { Loader2 } from "lucide-react";

export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center pt-20 pb-40">
      <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
      <h2 className="text-xl font-semibold text-slate-800">Loading Checkout...</h2>
      <p className="text-slate-500 mt-2">Preparing your order details</p>
    </div>
  );
}
