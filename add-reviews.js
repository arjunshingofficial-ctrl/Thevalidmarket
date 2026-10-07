const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  
  if (!products.length) {
    console.log("No products found.");
    return;
  }
  
  console.log(`Found ${products.length} products. Adding 20 reviews for each...`);
  
  // Create 20 dummy users if we don't have enough, or just reuse 20 new ones
  const dummyUsers = [];
  for (let i = 0; i < 20; i++) {
    const email = `reviewer_${Date.now()}_${i}@example.com`;
    const user = await prisma.user.create({
      data: {
        name: `Reviewer ${i + 1}`,
        email,
        password: "hashedpassword123", // Doesn't matter
      }
    });
    dummyUsers.push(user);
  }
  
  console.log(`Created 20 dummy users.`);
  
  const comments = [
    "Great product! Highly recommend.",
    "Worked flawlessly for my needs.",
    "Exactly what I was looking for.",
    "Fast delivery and good quality.",
    "Awesome service, 10/10.",
    "Good value for money.",
    "Very satisfied with this purchase.",
    "Exceeded my expectations.",
    "Will definitely buy again.",
    "Top notch quality and support.",
    "Amazing! Really helped my business.",
    "Could not be happier with this.",
    "Five stars all the way.",
    "The best out there.",
    "Super easy to use.",
    "Fantastic product, worth every penny.",
    "Absolutely perfect.",
    "Incredible results so far.",
    "Highly efficient and reliable.",
    "Great customer service and great product."
  ];

  let totalReviews = 0;
  for (const product of products) {
    for (const user of dummyUsers) {
      const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5 stars
      const comment = comments[Math.floor(Math.random() * comments.length)];
      const title = comment.split(" ").slice(0, 3).join(" ") + "...";
      
      try {
        await prisma.review.create({
          data: {
            userId: user.id,
            productId: product.id,
            rating,
            title,
            comment,
            status: "APPROVED",
            verifiedPurchase: true,
            avatarSeed: user.id
          }
        });
        totalReviews++;
      } catch(e) {
        // Might already exist
        console.error("Error creating review:", e);
      }
    }
    console.log(`Added 20 reviews for product: ${product.name}`);
  }
  
  console.log(`Successfully added ${totalReviews} reviews!`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => { 
    console.error(e); 
    prisma.$disconnect(); 
  });
