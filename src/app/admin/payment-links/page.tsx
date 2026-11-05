import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PaymentLinksClient from "@/components/admin/payment-links/PaymentLinksClient";
import { getUpiEffectiveInrRate } from "@/lib/fx";
import { getBaseUrl } from "@/lib/siteUrl";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payment Links | Admin Panel",
};

export default async function AdminPaymentLinksPage() {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "MANAGER", "STAFF"].includes(session.user.role)) {
    redirect("/admin");
  }

  const [rawLinks, inrRate] = await Promise.all([
    prisma.paymentLink.findMany({
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    getUpiEffectiveInrRate(),
  ]);

  const baseUrl = getBaseUrl();

  const links = rawLinks.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    expiresAt: l.expiresAt ? l.expiresAt.toISOString() : null,
    lastPaidAt: l.lastPaidAt ? l.lastPaidAt.toISOString() : null,
  }));

  return <PaymentLinksClient initialLinks={links as any} baseUrl={baseUrl} inrRate={inrRate} />;
}

