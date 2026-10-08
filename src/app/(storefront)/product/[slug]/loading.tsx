import { Loader2 } from "lucide-react";

export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="bg-white border-b border-slate-200/60 pb-16 pt-8 relative overflow-hidden">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl relative z-10">
          
          {/* Breadcrumbs skeleton */}
          <div className="flex items-center gap-2 mb-10 h-4">
            <div className="h-4 bg-slate-200 w-16 rounded animate-pulse"></div>
            <div className="h-4 bg-slate-200 w-16 rounded animate-pulse"></div>
            <div className="h-4 bg-slate-200 w-32 rounded animate-pulse"></div>
          </div>

          <div className="grid lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_480px] gap-12 xl:gap-16 items-start">
            {/* Gallery Skeleton */}
            <div className="space-y-6">
              <div className="p-2 bg-white rounded-3xl shadow-sm border border-slate-100">
                <div className="h-[400px] bg-slate-200 rounded-2xl animate-pulse"></div>
              </div>
            </div>

            {/* Product Details Skeleton */}
            <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 flex flex-col">
              <div className="h-6 bg-slate-200 w-1/4 rounded animate-pulse mb-6"></div>
              <div className="h-10 bg-slate-200 w-3/4 rounded animate-pulse mb-6"></div>
              <div className="h-20 bg-slate-200 w-full rounded animate-pulse mb-8"></div>
              
              <div className="h-12 bg-slate-200 w-1/3 rounded animate-pulse mb-8"></div>
              <div className="h-14 bg-slate-200 w-full rounded-xl animate-pulse mb-8"></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="h-16 bg-slate-200 rounded-xl animate-pulse"></div>
                <div className="h-16 bg-slate-200 rounded-xl animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Centered spinner for rest of page */}
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-slate-500 font-medium mt-4">Loading product details...</p>
      </div>
    </div>
  );
}
