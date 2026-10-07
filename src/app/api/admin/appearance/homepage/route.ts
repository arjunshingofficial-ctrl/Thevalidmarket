import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, createAuditLog } from "@/lib/actions/admin";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    const session = await requireAdmin("Settings", "Manage");
    const { action, config } = await req.json();

    if (!action || !["SAVE_DRAFT", "PUBLISH"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (!config || !Array.isArray(config.sections)) {
      return NextResponse.json({ error: "Invalid configuration format" }, { status: 400 });
    }

    const configString = JSON.stringify(config);

    if (action === "SAVE_DRAFT") {
      const settings = await prisma.siteSettings.upsert({
        where: { id: "GLOBAL" },
        update: { draftConfig: configString },
        create: { id: "GLOBAL", draftConfig: configString, homepageConfig: JSON.stringify({ sections: [] }) }
      });

      await createAuditLog({
        action: "HOMEPAGE_CMS_DRAFT_SAVED",
        entity: "SiteSettings",
        entityId: "GLOBAL",
        metadata: { actorEmail: session.user.email }
      });

      return NextResponse.json({ success: true, settings });
    }

    if (action === "PUBLISH") {
      const settings = await prisma.siteSettings.upsert({
        where: { id: "GLOBAL" },
        update: { homepageConfig: configString, draftConfig: configString }, // Update both so draft matches published
        create: { id: "GLOBAL", homepageConfig: configString, draftConfig: configString }
      });

      // Save revision snapshot for future rollbacks
      await prisma.customizationRevision.create({
        data: {
          name: `Homepage Published - ${new Date().toISOString()}`,
          config: JSON.stringify(settings),
          authorId: session.user.id
        }
      });

      await createAuditLog({
        action: "HOMEPAGE_CMS_PUBLISHED",
        entity: "SiteSettings",
        entityId: "GLOBAL",
        metadata: { actorEmail: session.user.email }
      });

      // Revalidate public homepage cache
      revalidatePath("/");

      return NextResponse.json({ success: true, settings });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
