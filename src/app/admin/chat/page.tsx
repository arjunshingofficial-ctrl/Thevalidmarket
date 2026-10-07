import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import CommunityChatClient from "@/components/chat/CommunityChatClient";
import AdminChatModerationClient from "@/components/chat/AdminChatModerationClient";
import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Chat Moderation | Admin",
};

export default async function AdminChatPage() {
  const session = await getServerSession(authOptions) as any;
  if (!session?.user) redirect("/login");
  
  const allowedRoles = ["ADMIN", "STAFF", "MANAGER", "SUPER_ADMIN"];
  const isAdmin = allowedRoles.includes(session.user?.role as string);
  
  if (!isAdmin) redirect("/dashboard");

  return (
    <div className="w-full h-full flex flex-col p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Community Chat Moderation</h1>
        <p className="text-sm text-slate-500">Monitor live chat, send announcements, and moderate messages.</p>
      </div>

      <div className="w-full max-w-5xl">
        <AdminChatModerationClient />
      </div>

      <div className="flex-1 w-full max-w-5xl">
        <CommunityChatClient user={session.user} isAdmin={true} />
      </div>
    </div>
  );
}
