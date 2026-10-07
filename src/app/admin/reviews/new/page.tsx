import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminReviewForm } from "@/components/admin/AdminReviewForm";

export const dynamic = "force-dynamic";

export default async function AdminAddReviewPage() {
  const session = await getServerSession(authOptions) as any;
  if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session?.user?.role)) {
    redirect("/");
  }

  const products = await prisma.product.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, image: true },
    orderBy: { name: "asc" }
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Add Review</h1>
        <p className="text-slate-500 mt-1">Create a verified customer review or admin testimonial.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <AdminReviewForm products={products} users={users} />
      </div>
    </div>
  );
}
