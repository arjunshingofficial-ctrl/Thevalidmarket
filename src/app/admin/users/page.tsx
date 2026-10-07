import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, Search, Plus, MoreVertical, Edit, Trash2, Wallet, Package } from "lucide-react";
import { formatUsd } from "@/lib/currency";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q || "";

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { email: { contains: query } },
        { accountId: { contains: query } },
      ],
    },
    include: {
      role: true,
      wallet: {
        include: {
          transactions: {
            where: { status: "COMPLETED" },
            select: { cashAmount: true, bonusAmount: true }
          }
        }
      },
      _count: {
        select: { orders: true, downloads: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Users & Customers</h1>
          <p className="text-slate-500 mt-1">Manage all registered users, roles, and wallets.</p>
        </div>
        <Link href="/admin/users/new" className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 flex items-center gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> Add User
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b flex gap-4 bg-slate-50">
          <form className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search by name, email, ID..."
              className="w-full pl-9 pr-4 py-2 bg-white border rounded-md text-sm outline-none focus:border-primary transition-colors"
            />
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 text-slate-500 font-medium border-b">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Account ID</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Wallet Balance</th>
                <th className="px-6 py-4">Orders</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{user.name || "No Name"}</div>
                        <div className="text-slate-500 text-xs">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-600">
                    {user.accountId || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium border">
                      {user.role?.name || "USER"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                      <Wallet className="h-4 w-4 text-emerald-500" />
                      {formatUsd(user.wallet?.transactions?.reduce((sum, tx) => sum + (tx.cashAmount || 0) + (tx.bonusAmount || 0), 0) || 0)}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Package className="h-4 w-4 text-slate-400" />
                      {user._count.orders}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-primary font-medium hover:underline inline-flex items-center gap-1"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <h3 className="text-lg font-medium text-slate-900">No users found</h3>
                    <p className="text-slate-500 mt-1">Try a different search term.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
