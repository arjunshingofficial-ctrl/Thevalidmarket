"use client";

import { useEffect, useState } from "react";
import { Terminal } from "lucide-react";

export default function ThemeToggle({ variant = 'button', onClick }: { variant?: 'button' | 'dropdown-item', onClick?: () => void }) {
  const [isHacker, setIsHacker] = useState(false);

  useEffect(() => {
    // Check local storage or default to false
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "hacker") {
      setIsHacker(true);
      document.documentElement.classList.add("theme-hacker");
    }
  }, []);

  const toggleTheme = () => {
    const newIsHacker = !isHacker;
    setIsHacker(newIsHacker);
    
    if (newIsHacker) {
      document.documentElement.classList.add("theme-hacker");
      localStorage.setItem("theme", "hacker");
    } else {
      document.documentElement.classList.remove("theme-hacker");
      localStorage.setItem("theme", "light");
    }
    if (onClick) onClick();
  };

  if (variant === 'dropdown-item') {
    return (
      <button 
        onClick={toggleTheme}
        className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 hover:text-primary transition-colors"
      >
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4" />
          Hacker Mode
        </div>
        <div className={`w-8 h-4 rounded-full relative transition-colors ${isHacker ? 'bg-emerald-500' : 'bg-slate-300'}`}>
          <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isHacker ? 'translate-x-4' : 'translate-x-0'}`} />
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
        isHacker 
          ? "bg-[#0a0a0c] text-emerald-500 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]" 
          : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
      }`}
      title={isHacker ? "Switch to Normal Theme" : "Switch to Hacker Theme"}
    >
      <Terminal className="h-3.5 w-3.5" />
      <span>{isHacker ? "HACKER ON" : "HACKER OFF"}</span>
    </button>
  );
}
