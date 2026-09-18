const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() { 
  const p = await prisma.product.count(); 
  const u = await prisma.user.count(); 
  console.log(`Products: ${p}, Users: ${u}`); 
} 
run().finally(() => prisma.$disconnect());
