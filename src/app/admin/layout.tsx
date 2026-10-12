import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminTopbar from "@/components/layout/AdminTopbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const allowedRoles = ["ADMIN", "STAFF", "MANAGER", "SUPER_ADMIN"];
  if (!allowedRoles.includes(session.user?.role as string)) {
    redirect("/dashboard");
  }

  return (
    <div id="admin-layout" className="flex flex-col md:flex-row min-h-screen md:h-screen bg-slate-50 md:overflow-hidden text-slate-900">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-h-0 md:overflow-hidden">
        <AdminTopbar session={session} />
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
