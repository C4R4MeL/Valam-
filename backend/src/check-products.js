const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Querying products from database...');
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        batch_code: true,
        images: true
      }
    });
    console.log('PRODUCTS IN DB:', JSON.stringify(products, null, 2));
  } catch (err) {
    console.error('Error querying products:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
