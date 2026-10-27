import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import DashboardTabletNav from "@/components/layout/DashboardTabletNav";

export const metadata: Metadata = {
  title: "Dashboard | The Valid Market",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="container max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8">
      {/* Tablet & Mobile Navigation Ribbon */}
      <DashboardTabletNav user={session.user} />

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-24">
          <div className="rounded-2xl border border-slate-200/80 bg-white text-slate-900 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/70 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {session.user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{session.user.name || "Customer"}</div>
                  <div className="text-xs text-slate-400 truncate">{session.user.email}</div>
                </div>
              </div>
            </div>
            
            <DashboardSidebar />
          </div>
        </aside>

        {/* Main Content - Full width on tablet and mobile */}
        <main className="flex-1 min-w-0 w-full">
          {children}
        </main>
        
      </div>
    </div>
  );
}
