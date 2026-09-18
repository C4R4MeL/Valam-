const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() { 
  try {
    const products = await prisma.product.findMany({
      include: {
        qc_result: true,
        supplier: {
          include: {
            profile: true,
            supplier_profile: true,
          }
        }
      }
    });
    console.log(`Success! Found ${products.length} products.`);
  } catch (err) {
    console.error('Prisma Error:', err);
  }
} 
run().finally(() => prisma.$disconnect());
