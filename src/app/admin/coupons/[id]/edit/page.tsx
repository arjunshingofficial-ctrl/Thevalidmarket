import { prisma } from "@/lib/prisma";
import CouponForm from "@/components/admin/CouponForm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const coupon = await prisma.coupon.findUnique({
    where: { id }
  });

  if (!coupon) notFound();

  return <CouponForm mode="edit" couponId={coupon.id} initialData={coupon} />;
}
