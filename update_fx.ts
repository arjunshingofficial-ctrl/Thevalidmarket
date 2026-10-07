import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });
  if (settings && settings.fxConfig) {
    const config = JSON.parse(settings.fxConfig);
    config.manualRate = 96;
    await prisma.siteSettings.update({
      where: { id: "GLOBAL" },
      data: { fxConfig: JSON.stringify(config) }
    });
    console.log("Updated fxConfig in DB");
  } else {
    console.log("No fxConfig in DB, default fallback will be used");
  }
}
main().then(() => prisma.$disconnect());
