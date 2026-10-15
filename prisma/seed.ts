import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' },
  });

  const customerRole = await prisma.role.upsert({
    where: { name: 'CUSTOMER' },
    update: {},
    create: { name: 'CUSTOMER' },
  });

  // Admin User
  const hashedPassword = await bcrypt.hash('SecurePassword123!', 10);
  await prisma.user.upsert({
    where: { email: 'admin@thevalidmarket.com' },
    update: {},
    create: {
      email: 'admin@thevalidmarket.com',
      name: 'Super Admin',
      password: hashedPassword,
      roleId: adminRole.id,
    },
  });

  // Categories
  const software = await prisma.category.upsert({
    where: { slug: 'software' },
    update: {},
    create: { name: 'Software', slug: 'software' },
  });

  const courses = await prisma.category.upsert({
    where: { slug: 'courses' },
    update: {},
    create: { name: 'Courses', slug: 'courses' },
  });

  // Products
  await prisma.product.upsert({
    where: { slug: 'premium-dev-suite' },
    update: {},
    create: {
      categoryId: software.id,
      name: 'Premium Dev Suite Pro',
      slug: 'premium-dev-suite',
      type: 'SOFTWARE',
      price: 2499,
      salePrice: 1999,
      status: 'PUBLISHED',
      shortDesc: 'The ultimate tool for developers looking to scale fast.',
      description: 'Full description goes here...',
      stock: -1,
    }
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
