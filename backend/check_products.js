const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() { 
  const products = await prisma.product.findMany(); 
  console.log(products.map(p => ({ id: p.id, status: p.status, stock: p.available_volume_kg, price: p.price_per_kg }))); 
} 
run().finally(() => prisma.$disconnect());
