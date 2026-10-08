import { Loader2 } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-slate-50/50">
      <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
      <h2 className="text-xl font-semibold text-slate-800">Loading...</h2>
    </div>
  );
}
