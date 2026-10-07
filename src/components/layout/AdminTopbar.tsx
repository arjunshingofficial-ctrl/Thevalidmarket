"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  Plus, Package, FileText, Folders, Ticket, FileSearch,
  BookOpen, Megaphone, HelpCircle, MessageSquare, UserCheck,
  ChevronDown, LogOut, User, ExternalLink
} from "lucide-react";
import { NotificationBell } from "./NotificationBell";

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

  return (
    <header className="hidden lg:flex h-16 bg-white border-b items-center justify-between px-6 shrink-0 z-20">
      {/* Left - breadcrumb space */}
      <div className="text-sm font-medium text-muted-foreground">
        <span className="text-slate-400">Asia D Market</span>
        <span className="text-slate-300 mx-2">/</span>
        <span className="text-slate-700 font-semibold">Admin</span>
      </div>

      {/* Right - actions */}
      <div className="flex items-center gap-3">
        {/* + Create button */}
        <div className="relative">
          <button
            onClick={() => { setCreateOpen(o => !o); setUserOpen(false); }}
            className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Create
            <ChevronDown className={`h-3 w-3 transition-transform ${createOpen ? "rotate-180" : ""}`} />
          </button>

          {createOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border shadow-xl overflow-hidden z-50">
              <div className="py-1">
                {CREATE_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setCreateOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <item.icon className="h-4 w-4 text-slate-400" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* View Store */}
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Store
        </Link>

        {/* Notifications */}
        <NotificationBell isAdmin={true} />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => { setUserOpen(o => !o); setCreateOpen(false); }}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              {session?.user?.email?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-semibold text-slate-900 leading-none">{session?.user?.name || "Admin"}</div>
              <div className="text-xs text-slate-500">{session?.user?.role}</div>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${userOpen ? "rotate-180" : ""}`} />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b bg-slate-50">
                <div className="text-sm font-semibold text-slate-900">{session?.user?.name}</div>
                <div className="text-xs text-slate-500 truncate">{session?.user?.email}</div>
              </div>
              <div className="py-1">
                <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  <User className="h-4 w-4 text-slate-400" />
                  My Account
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close */}
      {(createOpen || userOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setCreateOpen(false); setUserOpen(false); }}
        />
      )}
    </header>
  );
}
