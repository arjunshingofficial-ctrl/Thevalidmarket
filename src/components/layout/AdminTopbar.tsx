"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  Menu, Plus, Package, FileText, Folders, Ticket, FileSearch,
  BookOpen, Megaphone, HelpCircle, MessageSquare, UserCheck,
  ChevronDown, LogOut, User, ExternalLink
} from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import AdminMobileDrawer from "./AdminMobileDrawer";

const CREATE_ITEMS = [
  { label: "Product", href: "/admin/products/new", icon: Package },
  { label: "Blog Post", href: "/admin/blog/new", icon: FileText },
  { label: "Category", href: "/admin/categories/new", icon: Folders },
  { label: "Coupon", href: "/admin/coupons/new", icon: Ticket },
  { label: "Page", href: "/admin/pages/new", icon: FileSearch },
  { label: "Course", href: "/admin/courses/new", icon: BookOpen },
  { label: "Banner", href: "/admin/banners/new", icon: Megaphone },
  { label: "FAQ", href: "/admin/faq/new", icon: HelpCircle },
  { label: "Testimonial", href: "/admin/testimonials/new", icon: MessageSquare },
  { label: "Staff User", href: "/admin/staff", icon: UserCheck },
];

export default function AdminTopbar({ session }: { session: any }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <>
      <header className="flex h-14 md:h-16 bg-white border-b items-center justify-between px-3 sm:px-4 md:px-6 shrink-0 z-30 sticky top-0 md:static">
        {/* Left - Mobile Hamburger & Brand, Desktop Breadcrumb */}
        <div className="flex items-center gap-2.5">
          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden flex items-center justify-center p-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all"
            aria-label="Open Admin Navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Mobile Brand Link */}
          <Link href="/admin" className="md:hidden flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shadow-xs">
              <span className="text-white text-xs font-black">A</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-900 font-bold text-sm tracking-tight">Asia D</span>
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                Admin
              </span>
            </div>
          </Link>

          {/* Desktop Breadcrumb */}
          <div className="hidden md:flex items-center text-sm font-medium text-muted-foreground">
            <span className="text-slate-400">Asia D Market</span>
            <span className="text-slate-300 mx-2">/</span>
            <span className="text-slate-800 font-semibold">Admin Panel</span>
          </div>
        </div>

        {/* Right - actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* + Create button */}
          <div className="relative">
            <button
              onClick={() => { setCreateOpen(o => !o); setUserOpen(false); }}
              className="flex items-center gap-1 sm:gap-1.5 bg-primary text-white px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-colors shadow-xs"
              aria-label="Quick Create Menu"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden xs:inline">Create</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${createOpen ? "rotate-180" : ""}`} />
            </button>

            {createOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 bg-slate-50 border-b text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Quick Create
                </div>
                <div className="py-1 max-h-[70vh] overflow-y-auto">
                  {CREATE_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setCreateOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors"
                    >
                      <item.icon className="h-4 w-4 text-slate-400" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* View Store (visible on tablet/desktop) */}
          <Link
            href="/"
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            Store
          </Link>

          {/* Notifications Bell */}
          <NotificationBell isAdmin={true} />

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => { setUserOpen(o => !o); setCreateOpen(false); }}
              className="flex items-center gap-1.5 sm:gap-2 pl-1 pr-1.5 sm:pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Admin User Menu"
            >
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs sm:text-sm">
                {session?.user?.email?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs sm:text-sm font-semibold text-slate-900 leading-none">{session?.user?.name || "Admin"}</div>
                <div className="text-[10px] text-slate-500">{session?.user?.role || "ADMIN"}</div>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${userOpen ? "rotate-180" : ""}`} />
            </button>

            {userOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-3 border-b bg-slate-50">
                  <div className="text-xs font-semibold text-slate-900">{session?.user?.name || "Admin User"}</div>
                  <div className="text-[11px] text-slate-500 truncate">{session?.user?.email}</div>
                  <div className="mt-1 inline-block text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded uppercase">
                    {session?.user?.role || "ADMIN"}
                  </div>
                </div>
                <div className="py-1">
                  <Link 
                    href="/dashboard" 
                    onClick={() => setUserOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <User className="h-4 w-4 text-slate-400" />
                    Customer Dashboard
                  </Link>
                  <Link 
                    href="/" 
                    target="_blank"
                    onClick={() => setUserOpen(false)}
                    className="flex sm:hidden items-center gap-2.5 px-4 py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <ExternalLink className="h-4 w-4 text-slate-400" />
                    View Store
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Backdrop for click outside dropdowns */}
        {(createOpen || userOpen) && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => { setCreateOpen(false); setUserOpen(false); }}
          />
        )}
      </header>

      {/* Slide-out Mobile Navigation Drawer */}
      <AdminMobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        session={session}
      />
    </>
  );
}
