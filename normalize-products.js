const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany();
    console.log(`Found ${products.length} products.`);
    
    for (const p of products) {
        if (p.price > 100) {
            console.log(`Product: ${p.name}, Price: ${p.price}`);
            
            // Normalize obvious demo products
            if (p.price === 1200) {
                await prisma.product.update({ where: { id: p.id }, data: { price: 19.99, salePrice: null } });
                console.log(`Updated ${p.name} to 19.99 USD`);
            } else if (p.price === 1500) {
                await prisma.product.update({ where: { id: p.id }, data: { price: 29.99, salePrice: null } });
                console.log(`Updated ${p.name} to 29.99 USD`);
            } else if (p.price === 2499 || p.price === 1999) {
                await prisma.product.update({ where: { id: p.id }, data: { price: 49.00, salePrice: 39.99 } });
                console.log(`Updated ${p.name} to 49.00 USD`);
            } else if (p.price > 500) {
                // Just log it as requiring normalization
                console.log(`WARNING: Product ${p.name} might require manual normalization (Price: ${p.price})`);
                await prisma.product.update({ where: { id: p.id }, data: { price: 99.00, salePrice: null } });
                console.log(`Updated ${p.name} to 99.00 USD as fallback demo conversion`);
            }
        }
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
