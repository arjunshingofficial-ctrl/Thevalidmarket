import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Search } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCustomers({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q || "";

  const customers = await prisma.user.findMany({
    where: {
      role: { name: "CUSTOMER" },
      ...(q && {
        OR: [
          { email: { contains: q } },
          { name: { contains: q } },
        ]
      })
    },
    include: {
      role: true,
      _count: { select: { orders: true } },
      orders: {
        where: { paymentStatus: "PAID" },
        select: { total: true }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Customers</h1>
          <p className="text-slate-500 mt-1">View and manage all customer accounts.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50/50">
          <form className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Orders</th>
                <th className="px-6 py-4 font-semibold text-right">Total Spent</th>
                <th className="px-6 py-4 font-semibold">Joined</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map(customer => {
                const totalSpent = customer.orders.reduce((sum, o) => sum + o.total, 0);
                const isVerified = customer.emailVerified !== null;
                return (
                  <tr key={customer.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                          {customer.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{customer.name || "Anonymous"}</div>
                          <div className="text-xs text-slate-500">{customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {isVerified ? "Active" : "Unverified"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-medium">
                      {customer._count.orders}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      ${totalSpent.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {customer.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link 
                          href={`/admin/customers/${customer.id}`}
                          className="px-2 py-1 text-xs border rounded bg-white hover:bg-slate-50 text-slate-700 font-medium"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <p className="text-lg font-medium text-slate-900">No customers found</p>
                    {q && <p>No results for "{q}"</p>}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t bg-slate-50 flex justify-between items-center">
          <span className="text-sm text-slate-500">Showing {customers.length} customers</span>
        </div>
      </div>
    </div>
  );
}
