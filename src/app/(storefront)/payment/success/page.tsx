import { redirect } from "next/navigation";

export default async function PaymentSuccessAlias({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolved = await searchParams;
  const query = new URLSearchParams();
  for (const [key, val] of Object.entries(resolved)) {
    if (val) query.set(key, Array.isArray(val) ? val[0] : val);
  }
  redirect(`/payment-success?${query.toString()}`);
}
