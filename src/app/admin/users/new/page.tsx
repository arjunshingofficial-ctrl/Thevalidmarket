import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import NewUserClient from "./NewUserClient";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewUserPage() {
  const roles = await prisma.role.findMany();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/users" className="p-2 hover:bg-slate-100 rounded-md transition-colors text-slate-500">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Add New User</h1>
          <p className="text-slate-500 text-sm">Create a new customer or admin account manually.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <NewUserClient roles={roles} />
      </div>
    </div>
  );
}
