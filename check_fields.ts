import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const fields = await prisma.fieldDefinition.findMany();
  console.log(fields.map(f => f.name));
}
main().then(() => prisma.$disconnect());
