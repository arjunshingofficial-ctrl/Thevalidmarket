import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import Link from "next/link";
import VIPDropsClient from "./VIPDropsClient";

export const dynamic = "force-dynamic";

export default async function VIPDropsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  // Fetch user role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { role: true }
  });

  // Check if user has bought VIP Access
  const hasVip = await prisma.orderItem.findFirst({
    where: {
      order: {
        userId: session.user.id,
        paymentStatus: "PAID"
      },
      product: {
        slug: "vip-access"
      }
    }
  });

  const isAdmin = user?.role?.name === "ADMIN";

  if (!hasVip && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <Lock className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-4">VIP Access Required</h2>
        <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">
          You need an active VIP Membership to access the daily free drops. VIP members get premium software, courses, and resources for free!
        </p>
        <Link 
          href="/store?q=vip"
          className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg"
        >
          Join VIP Now
        </Link>
      </div>
    );
  }

  // Fetch VIP Drop Products (Admin puts them in category 'vip-drops')
  const drops = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      category: {
        slug: "vip-drops"
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return <VIPDropsClient drops={drops} isAdmin={isAdmin} />;
}
