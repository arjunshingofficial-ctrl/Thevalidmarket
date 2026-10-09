const fs = require('fs');
const path = require('path');

const dashDir = path.join(__dirname, 'src', 'app', '(storefront)', 'dashboard');
const dirs = fs.readdirSync(dashDir).filter(f => fs.statSync(path.join(dashDir, f)).isDirectory());

const genericLoading = `import { Loader2 } from "lucide-react";

export default function DashboardRouteLoading() {
  return (
    <div className="flex flex-col w-full h-full space-y-4 opacity-70">
      <div className="h-8 bg-slate-200 rounded w-1/3 animate-pulse mb-4"></div>
      
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 min-h-[300px] flex justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    </div>
  );
}
`;

dirs.forEach(d => {
  const loadingPath = path.join(dashDir, d, 'loading.tsx');
  if (!fs.existsSync(loadingPath)) {
    fs.writeFileSync(loadingPath, genericLoading);
    console.log('Added to', d);
  }
});
