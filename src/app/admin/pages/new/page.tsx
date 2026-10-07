import PageEditor from "@/components/admin/PageEditor";
import { requireAdmin } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function NewPage() {
  await requireAdmin("Content", "Manage");
  return <PageEditor mode="create" />;
}
