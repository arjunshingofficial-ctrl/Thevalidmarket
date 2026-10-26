import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { 
  Users, 
  Search, 
  Plus, 
  Wallet, 
  Package, 
  ShoppingCart, 
  ShieldCheck, 
  UserCheck, 
  RotateCcw,
  ExternalLink
} from "lucide-react";
import { formatUsd } from "@/lib/currency";

export const dynamic = "force-dynamic";

interface AdminUsersPageProps {
  searchParams: Promise<{ q?: string; role?: string }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const resolvedSearchParams = (await Promise.resolve(searchParams)) || {};
  const query = (resolvedSearchParams.q || "").trim();
  const selectedRole = (resolvedSearchParams.role || "").trim();

  // Overview counts
  const [
    totalUsersCount,
    totalCustomersCount,
    totalStaffCount,
    totalOrdersCount,
    users,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        OR: [
          { role: { name: "CUSTOMER" } },
          { roleId: null },
        ],
      },
    }),
    prisma.user.count({
      where: {
        role: {
          name: { in: ["ADMIN", "SUPER_ADMIN", "STAFF", "MANAGER"] },
        },
      },
    }),
    prisma.order.count(),
    prisma.user.findMany({
      where: {
        ...(selectedRole ? { role: { name: selectedRole } } : {}),
        ...(query ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { accountId: { contains: query, mode: "insensitive" } },
          ],
        } : {}),
      },
      include: {
        role: true,
        wallet: {
          include: {
            transactions: {
              where: { status: "COMPLETED" },
              select: { cashAmount: true, bonusAmount: true },
            },
          },
        },
        _count: {
          select: { orders: true, downloads: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Users & Accounts</h1>
          <p className="text-slate-500 mt-1">
            Manage registered accounts, view order counts per user, and manage roles.
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 flex items-center gap-2 shadow-sm shrink-0"
        >
          <Plus className="h-4 w-4" /> Add User
        </Link>
      </div>

      {/* KPI Stat Cards: Total Users, Customers, Staff/Admins, Total Orders */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Users</span>
            <span className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
              <Users className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{totalUsersCount.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-0.5">All registered accounts</p>
          </div>
        </div>

        {/* Customers */}
        <Link
          href="/admin/customers"
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 group-hover:underline">Customers</span>
            <span className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
              <UserCheck className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-indigo-600">{totalCustomersCount.toLocaleString()}</div>
            <p className="text-xs text-indigo-600/80 mt-0.5 font-medium flex items-center gap-1">
              <span>View customer list</span>
              <span>→</span>
            </p>
          </div>
        </Link>

        {/* Staff & Admins */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-700">Staff & Admins</span>
            <span className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
              <ShieldCheck className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-purple-600">{totalStaffCount.toLocaleString()}</div>
            <p className="text-xs text-purple-600/80 mt-0.5 font-medium">Internal privileged roles</p>
          </div>
        </div>

        {/* Total Orders Placed Across System */}
        <Link
          href="/admin/orders"
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 group-hover:underline">Total Orders</span>
            <span className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <ShoppingCart className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-emerald-600">{totalOrdersCount.toLocaleString()}</div>
            <p className="text-xs text-emerald-600/80 mt-0.5 font-medium flex items-center gap-1">
              <span>View all orders</span>
              <span>→</span>
            </p>
          </div>
        </Link>
      </div>

      {/* Main Users Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/50">
          <form method="GET" action="/admin/users" className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search by name, email, or account ID..."
              className="w-full pl-9 pr-4 py-2 bg-white border rounded-md text-sm outline-none focus:border-primary transition-colors"
            />
          </form>

          <div className="flex items-center gap-2">
            {query && (
              <Link
                href="/admin/users"
                className="flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-xs bg-white text-slate-600 hover:bg-slate-50 font-medium"
              >
                <RotateCcw className="h-3 w-3" /> Clear
              </Link>
            )}
            <span className="text-xs text-slate-500 font-medium">
              Showing <strong>{users.length}</strong> of <strong>{totalUsersCount}</strong> users
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/70 text-slate-600 font-semibold text-xs uppercase tracking-wider border-b">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Account ID</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Wallet Balance</th>
                <th className="px-6 py-4 text-center">Orders Placed</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => {
                const orderCount = user._count.orders;
                return (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    {/* User */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                          {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="font-semibold text-slate-900 hover:text-primary hover:underline block"
                          >
                            {user.name || "No Name"}
                          </Link>
                          <div className="text-slate-500 text-xs">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Account ID */}
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">
                      {user.accountId || "—"}
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        user.role?.name === "ADMIN" || user.role?.name === "SUPER_ADMIN"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : user.role?.name === "STAFF" || user.role?.name === "MANAGER"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}>
                        {user.role?.name || "CUSTOMER"}
                      </span>
                    </td>

                    {/* Wallet Balance */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                        <Wallet className="h-4 w-4 text-emerald-500" />
                        {formatUsd(
                          user.wallet?.transactions?.reduce(
                            (sum, tx) => sum + (tx.cashAmount || 0) + (tx.bonusAmount || 0),
                            0
                          ) || 0
                        )}
                      </div>
                    </td>

                    {/* Orders Placed (Clickable Badge) */}
                    <td className="px-6 py-4 text-center">
                      {orderCount > 0 ? (
                        <Link
                          href={`/admin/orders?userId=${user.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors shadow-xs"
                          title={`Click to view all ${orderCount} orders placed by ${user.name || user.email}`}
                        >
                          <Package className="h-3.5 w-3.5" />
                          <span>{orderCount} {orderCount === 1 ? 'order' : 'orders'}</span>
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs text-slate-400 bg-slate-50 border border-slate-100">
                          0 orders
                        </span>
                      )}
                    </td>

                    {/* Joined */}
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {orderCount > 0 && (
                          <Link
                            href={`/admin/orders?userId=${user.id}`}
                            className="text-xs text-blue-700 hover:text-blue-800 font-semibold px-2.5 py-1 rounded-md border border-blue-200 hover:bg-blue-50 transition-colors inline-flex items-center gap-1"
                            title="View orders for this user"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            <span>Orders</span>
                          </Link>
                        )}
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="text-xs text-slate-700 hover:text-slate-900 font-medium px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                          Manage
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
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

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50 flex justify-between items-center text-sm text-slate-500">
          <span>Showing <strong>{users.length}</strong> of <strong>{totalUsersCount}</strong> users</span>
          <span className="text-xs text-slate-400">{totalOrdersCount} orders placed across all users</span>
        </div>
      </div>
    </div>
  );
}
