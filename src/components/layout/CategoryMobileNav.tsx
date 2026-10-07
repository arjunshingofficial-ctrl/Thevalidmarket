"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { X, Filter, ChevronRight, LayoutGrid } from "lucide-react";
import { usePathname } from "next/navigation";

export default function CategoryMobileNav({ categories, currentCategory }: { categories: any[], currentCategory: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);

  const toggleDrawer = () => setIsOpen(!isOpen);
  const closeDrawer = () => setIsOpen(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    closeDrawer();
  }, [pathname]);

  return (
    <>
      <button 
        type="button"
        onClick={toggleDrawer}
        className="md:hidden flex items-center justify-center w-full px-4 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md shadow-slate-900/10 hover:bg-slate-800 active:scale-[0.98] transition-all"
      >
        <Filter className="h-4 w-4 mr-2" /> Browse Categories
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-[100] md:hidden backdrop-blur-sm transition-opacity"
          onClick={closeDrawer}
        />
      )}

      {/* Drawer */}
      <div 
        ref={drawerRef}
        className={`fixed top-0 left-0 h-full w-[300px] max-w-[85vw] bg-slate-900 z-[110] shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden flex flex-col overflow-y-auto border-r border-slate-800 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-5 bg-slate-950/50 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-primary" />
            <span className="text-xl font-black tracking-tight text-white uppercase">Categories</span>
          </div>
          <button onClick={closeDrawer} aria-label="Close categories" className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 py-6 flex flex-col">
          <ul className="flex flex-col space-y-1.5 px-3">
            <li>
              <Link 
                href="/store"
                className={`flex items-center justify-between px-4 py-3 rounded-lg text-base transition-all ${
                  currentCategory === "all" || currentCategory === "store"
                    ? "bg-gradient-to-r from-blue-600/20 to-transparent border-l-4 border-blue-500 text-white font-bold"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white font-medium border-l-4 border-transparent"
                }`}
              >
                <span>All Products</span>
                <ChevronRight className={`w-4 h-4 ${currentCategory === 'all' || currentCategory === 'store' ? 'text-blue-500' : 'text-slate-500'}`} />
              </Link>
            </li>
            {categories.map((cat: any) => {
              const isActive = currentCategory === cat.slug;
              return (
                <li key={cat.id}>
                  <Link 
                    href={`/category/${cat.slug}`}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg text-base transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600/20 to-transparent border-l-4 border-blue-500 text-white font-bold"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white font-medium border-l-4 border-transparent"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <ChevronRight className={`w-4 h-4 ${isActive ? 'text-blue-500' : 'text-slate-500'}`} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
}
