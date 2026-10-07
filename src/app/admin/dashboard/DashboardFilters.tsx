"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function DashboardFilters({ currentRange }: { currentRange: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <select 
        value={currentRange}
        onChange={(e) => {
          router.push(`/admin/dashboard?range=${e.target.value}`);
        }}
        className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
      >
        <option value="7d">7 Days</option>
        <option value="30d">30 Days</option>
        <option value="90d">90 Days</option>
        <option value="1y">1 Year</option>
      </select>
    </div>
  );
}
