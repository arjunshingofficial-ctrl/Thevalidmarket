import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { Printer } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions) as any;
  
  if (!session?.user) redirect("/login");

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      user: true,
      payments: true
    }
  });

  if (!order) notFound();

  // Access control: Only buyer or Admin can view
  const isAdmin = ["ADMIN", "SUPER_ADMIN", "MANAGER", "STAFF"].includes(session.user.role);
  if (order.userId !== session.user.id && !isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-100 py-12 print:bg-white print:py-0">
      <div className="max-w-3xl mx-auto px-4">
        {/* Actions - hidden in print */}
        <div className="flex justify-end mb-6 print:hidden">
          <button 
            className="flex items-center gap-2 bg-white border shadow-sm px-4 py-2 rounded-md font-medium text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            // The browser print dialog is triggered client-side, but since this is a Server Component,
            // we'll inject a small inline script for the print button or we can make it a client component.
            // For simplicity, we just use onClick via a small client wrapper, but here we can just use generic JS.
            type="button"
          >
            <Printer className="h-4 w-4" /> Print Invoice
          </button>
        </div>

        {/* Invoice Paper */}
        <div className="bg-white border shadow-sm p-10 md:p-16 rounded-xl print:shadow-none print:border-none print:p-0">
          
          <div className="flex justify-between items-start mb-12">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">THE VALID MARKET</h1>
              <p className="text-slate-500 mt-1">Digital Products. Software. Courses.</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-semibold text-slate-300 uppercase tracking-widest">Invoice</h2>
              <p className="text-slate-900 font-medium mt-1">#{order.id.slice(0, 8).toUpperCase()}</p>
              <p className="text-slate-500 text-sm mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 mb-12 border-t pt-8">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Billed To</p>
              <p className="font-medium text-slate-900">{order.user.name || "Customer"}</p>
              <p className="text-slate-500 text-sm">{order.user.email}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Payment Info</p>
              <p className="font-medium text-slate-900">Method: {order.payments[0]?.method || "N/A"}</p>
              <p className="text-slate-500 text-sm">Status: {order.paymentStatus}</p>
            </div>
          </div>

          <table className="w-full text-left mb-12">
            <thead className="border-b border-slate-200">
              <tr>
                <th className="py-3 font-semibold text-sm text-slate-900">Product</th>
                <th className="py-3 font-semibold text-sm text-slate-900 text-center">Qty</th>
                <th className="py-3 font-semibold text-sm text-slate-900 text-right">Price</th>
                <th className="py-3 font-semibold text-sm text-slate-900 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map(item => (
                <tr key={item.id}>
                  <td className="py-4 text-slate-800">{item.product.name}</td>
                  <td className="py-4 text-center text-slate-600">{item.quantity}</td>
                  <td className="py-4 text-right text-slate-600">${item.price.toLocaleString()}</td>
                  <td className="py-4 text-right font-medium text-slate-900">${(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-64 space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>${order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Discount</span>
                <span>-${order.discount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax</span>
                <span>${order.tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-lg text-slate-900 pt-3 border-t border-slate-200">
                <span>Total</span>
                <span>${order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t text-center text-sm text-slate-400">
            <p>Thank you for shopping with The Valid Market.</p>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.querySelector('button').addEventListener('click', () => window.print());
        `
      }} />
    </div>
  );
}
