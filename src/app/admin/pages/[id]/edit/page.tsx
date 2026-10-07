import { prisma } from "@/lib/prisma";
import PageEditor from "@/components/admin/PageEditor";
import { requireAdmin } from "@/lib/actions/admin";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("Content", "Manage");
  const { id } = await params;
  
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) notFound();
  
  return <PageEditor mode="edit" initialData={page} pageId={id} />;
}
