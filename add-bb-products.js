const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Get BB category
  let bbCategory = await prisma.category.findUnique({
    where: { slug: "bb" }
  });
  
  if (!bbCategory) {
    bbCategory = await prisma.category.create({
      data: {
        name: "BB",
        slug: "bb",
        displayMode: "TABLE"
      }
    });
    console.log("Created BB category");
  } else {
    console.log("Found BB category");
  }

  // 2. Get or create Field Definitions
  const ensureField = async (name, slug) => {
    let field = await prisma.fieldDefinition.findUnique({ where: { slug } });
    if (!field) {
      field = await prisma.fieldDefinition.create({
        data: { name, slug, type: "TEXT" }
      });
      console.log(`Created field ${name}`);
    }
    return field;
  };

  const countryField = await ensureField("Country", "country");
  const balanceField = await ensureField("Balance", "balance");

  const countries = ["US", "UK", "Canada", "Australia", "Germany", "France", "Japan", "Brazil", "India", "Nigeria", "Nepal", "Spain", "Italy"];
  
  console.log("Generating 30 BB products...");
  for (let i = 1; i <= 30; i++) {
    const price = Math.floor(Math.random() * 11) + 10; // 10 to 20
    const balance = Math.floor(Math.random() * 5000) + 100;
    const country = countries[Math.floor(Math.random() * countries.length)];
    const randomId = Math.floor(Math.random() * 100000);
    
    // Create Product
    await prisma.product.create({
      data: {
        name: `Dark Market BB ${randomId}`,
        slug: `bb-product-${Date.now()}-${randomId}`,
        categoryId: bbCategory.id,
        type: "DIGITAL",
        price,
        status: "PUBLISHED",
        fieldValues: {
          create: [
            { fieldId: countryField.id, value: country },
            { fieldId: balanceField.id, value: balance.toString() }
          ]
        }
      }
    });
  }
  
  console.log("Successfully created 30 BB products!");
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => { 
    console.error(e); 
    prisma.$disconnect(); 
  });
