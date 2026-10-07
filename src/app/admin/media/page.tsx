import { prisma } from "@/lib/prisma";
import MediaLibraryClient from "./MediaLibraryClient";

export const dynamic = "force-dynamic";

export default async function MediaLibraryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Media Library</h1>
        <p className="text-slate-500 mt-1">Manage uploaded images and files for products and categories.</p>
      </div>

      <MediaLibraryClient />
    </div>
  );
}
