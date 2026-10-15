import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CopyUserId from "../wallet/CopyUserId";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">Update your personal information.</p>
      </div>

      {user.accountId && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden p-6 max-w-2xl flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">User ID</h2>
            <p className="text-sm text-slate-500">Use this ID to receive money from other The Valid Market users.</p>
          </div>
          <CopyUserId accountId={user.accountId} />
        </div>
      )}

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden p-6 max-w-2xl">
        <form className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <input className="flex h-10 w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm" defaultValue={user.name || ""} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <input className="flex h-10 w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm" defaultValue={user.username || ""} disabled />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address</label>
            <input className="flex h-10 w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm" defaultValue={user.email} disabled />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone Number</label>
            <input className="flex h-10 w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm" defaultValue={user.phone || ""} placeholder="+1 (555) 000-0000" disabled />
          </div>
          <button type="button" disabled className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm opacity-50 cursor-not-allowed">
            Save Changes (Coming Soon)
          </button>
        </form>
      </div>
    </div>
  );
}
