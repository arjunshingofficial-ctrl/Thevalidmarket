import { Loader2 } from "lucide-react";

export default function StoreLoading() {
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center pt-20 pb-40">
      <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
      <h2 className="text-xl font-semibold text-slate-800">Loading Store...</h2>
      <p className="text-slate-500 mt-2">Fetching the latest products and categories</p>
      
      {/* Basic skeleton grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 min-[1440px]:grid-cols-5 gap-4 md:gap-5 min-[1440px]:gap-6 mt-12 w-full max-w-[1600px] px-4 md:px-6 lg:px-8 opacity-50">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div key={i} className="flex flex-col rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden h-[340px]">
            <div className="h-44 bg-slate-200 animate-pulse"></div>
            <div className="flex flex-col p-5 gap-3">
              <div className="h-4 bg-slate-200 rounded w-1/3 animate-pulse"></div>
              <div className="h-5 bg-slate-200 rounded w-3/4 animate-pulse mt-2"></div>
              <div className="mt-auto pt-4 flex justify-between">
                <div className="h-6 bg-slate-200 rounded w-1/4 animate-pulse"></div>
                <div className="h-8 bg-slate-200 rounded w-1/3 animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
