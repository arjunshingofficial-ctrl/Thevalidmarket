const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'src', 'app', 'admin');
const dirs = fs.readdirSync(adminDir).filter(f => fs.statSync(path.join(adminDir, f)).isDirectory());

const genericLoading = `import { Loader2 } from "lucide-react";

export default function AdminRouteLoading() {
  return (
    <div className="flex flex-col w-full h-full space-y-6 opacity-60">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-4">
        <div className="h-8 bg-slate-200 rounded w-1/4 animate-pulse"></div>
        <div className="h-10 bg-slate-200 rounded w-32 animate-pulse"></div>
      </div>
      
      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl shadow-sm animate-pulse"></div>
        ))}
      </div>
      
      {/* Table Skeleton */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex-1 min-h-[400px]">
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      </div>
    </div>
  );
}
`;

dirs.forEach(d => {
  const loadingPath = path.join(adminDir, d, 'loading.tsx');
  if (!fs.existsSync(loadingPath)) {
    fs.writeFileSync(loadingPath, genericLoading);
    console.log('Added to', d);
  }
});
