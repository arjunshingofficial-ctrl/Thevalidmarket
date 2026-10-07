import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ManageUserClient from "./ManageUserClient";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getWalletBalance } from "@/lib/wallet";

export const dynamic = "force-dynamic";

export default async function AdminManageUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      wallet: true,
      orders: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!user) {
    return notFound();
  }

  const roles = await prisma.role.findMany();
  const walletBalance = await getWalletBalance(user.id);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/users" className="p-2 hover:bg-slate-100 rounded-md transition-colors text-slate-500">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manage User</h1>
          <p className="text-slate-500 text-sm">Viewing details for {user.name || user.email}</p>
        </div>
      </div>

      <ManageUserClient user={user} roles={roles} walletBalance={walletBalance} />
    </div>
  );
}
