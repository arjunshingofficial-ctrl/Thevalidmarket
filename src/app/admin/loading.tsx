import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
      <h2 className="text-xl font-semibold text-slate-800">Loading...</h2>
      <p className="text-slate-500 mt-2">Fetching administration data</p>
    </div>
  );
}
