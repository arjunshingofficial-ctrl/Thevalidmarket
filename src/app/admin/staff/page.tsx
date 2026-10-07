import { prisma } from "@/lib/prisma";
import StaffForm from "@/components/admin/StaffForm";
import { requireAdmin } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  await requireAdmin("Staff", "View");

  const staff = await prisma.user.findMany({
    where: { 
      role: {
        name: { in: ["ADMIN", "SUPER_ADMIN", "STAFF", "MANAGER"] }
      }
    },
    include: { role: true },
    orderBy: { createdAt: "desc" }
  });

  const roles = await prisma.role.findMany();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Staff Management</h1>
        <p className="text-slate-500 mt-1">Manage staff users, managers, and admins.</p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <StaffForm staff={staff} roles={roles} />
      </div>
    </div>
  );
}
