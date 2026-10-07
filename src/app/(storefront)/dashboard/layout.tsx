import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden sticky top-24">
            <div className="p-4 bg-muted/50 border-b">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {session.user.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-sm">{session.user.name || "Customer"}</div>
                  <div className="text-xs text-muted-foreground">{session.user.email}</div>
                </div>
              </div>
            </div>
            
            <DashboardSidebar />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
        
      </div>
    </div>
  );
}
