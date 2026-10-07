import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const cat = await prisma.category.findUnique({ where: { slug: "bb" } });
  if (cat) {
    console.log("Current display mode:", cat.displayMode);
    if (cat.displayMode !== "SPECIAL_BB") {
      await prisma.category.update({
        where: { slug: "bb" },
        data: { displayMode: "SPECIAL_BB" }
      });
      console.log("Updated to SPECIAL_BB");
    }
  } else {
    console.log("Category not found");
  }
}
main().then(() => prisma.$disconnect());
