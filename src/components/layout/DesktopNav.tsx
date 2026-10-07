"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

type MenuItem = {
  id: string;
  label: string;
  url: string;
  openInNew: boolean;
  children?: MenuItem[];
};

export default function DesktopNav({ items = [] }: { items?: MenuItem[] }) {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  if (!items.length) {
    // Fallback menu if database menu is empty
    return (
      <nav className="hidden md:flex gap-6">
        <Link href="/" className="text-[15px] font-medium transition-colors hover:text-primary text-slate-700">Home</Link>
        <Link href="/store" className="text-[15px] font-medium transition-colors hover:text-primary text-slate-700">Store</Link>
        <Link href="/courses" className="text-[15px] font-medium transition-colors hover:text-primary text-slate-700">Courses</Link>
      </nav>
    );
  }

  return (
    <nav className="hidden lg:flex items-center gap-1">
      {items.map((item) => {
        const hasChildren = item.children && item.children.length > 0;
        const isActive = pathname === item.url || (item.url !== "/" && pathname.startsWith(item.url));

        if (hasChildren) {
          return (
            <div 
              key={item.id} 
              className="relative group px-3 py-2"
              onMouseEnter={() => setOpenDropdown(item.id)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button 
                className={`flex items-center gap-1 text-[15px] font-medium transition-colors ${
                  isActive || openDropdown === item.id ? "text-primary" : "text-slate-700 hover:text-primary"
                }`}
              >
                {item.label}
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openDropdown === item.id ? "rotate-180" : ""}`} />
              </button>
              
              {/* Dropdown Menu */}
              <div 
                className={`absolute top-full left-0 mt-1 w-48 rounded-xl border bg-white shadow-lg transition-all duration-200 origin-top-left ${
                  openDropdown === item.id ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
                }`}
              >
                <div className="py-2 flex flex-col">
                  {item.children?.map((child) => (
                    <Link
                      key={child.id}
                      href={child.url}
                      target={child.openInNew ? "_blank" : "_self"}
                      className="px-4 py-2.5 text-sm text-slate-700 hover:text-primary hover:bg-slate-50 transition-colors"
                      onClick={() => setOpenDropdown(null)}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          );
        }

        return (
          <Link
            key={item.id}
            href={item.url}
            target={item.openInNew ? "_blank" : "_self"}
            className={`px-3 py-2 text-[15px] font-medium transition-all ${
              isActive 
                ? "text-primary bg-primary/5 rounded-md" 
                : "text-slate-700 hover:text-primary"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
