const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() { 
  try {
    await prisma.$queryRawUnsafe(`SELECT * FROM "supplier_profiles" LIMIT 1`);
    console.log('Table exists!');
  } catch(e) {
    console.error(e.message);
  }
} 
run().finally(() => prisma.$disconnect());
