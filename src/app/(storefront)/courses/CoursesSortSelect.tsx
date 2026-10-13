"use client";

import { SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CoursesSortSelect({ initialSort = "newest" }: { initialSort?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("sort", newSort);
    params.delete("page"); // reset pagination on sort change
    router.push(`/courses?${params.toString()}`);
  };

  return (
    <div className="relative flex items-center">
      <SlidersHorizontal className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
      <select
        value={initialSort}
        onChange={(e) => handleSortChange(e.target.value)}
        className="text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-8 focus:ring-2 focus:ring-primary/40 focus:border-primary/50 cursor-pointer shadow-2xs"
      >
        <option value="newest">Sort: Newest First</option>
        <option value="oldest">Sort: Oldest First</option>
        <option value="price_asc">Sort: Price Low → High</option>
        <option value="price_desc">Sort: Price High → Low</option>
        <option value="highest_rated">Sort: Highest Rated</option>
      </select>
    </div>
  );
}
