const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const coursesCategory = await prisma.category.findUnique({
    where: { slug: "courses" },
    include: { products: true }
  });
  
  if (!coursesCategory) {
    console.log("No courses category found.");
    return;
  }
  
  console.log(`Updating images for ${coursesCategory.products.length} courses...`);
  
  for (const product of coursesCategory.products) {
    const meta = product.metadata ? JSON.parse(product.metadata) : {};
    meta.image = "/cyber_security_thumbnail.jpg";
    
    await prisma.product.update({
      where: { id: product.id },
      data: { metadata: JSON.stringify(meta) }
    });
  }
  
  console.log("Successfully updated all course product images!");
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => { 
    console.error(e); 
    prisma.$disconnect(); 
  });
