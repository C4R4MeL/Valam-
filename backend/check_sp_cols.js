const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() { 
  try {
    const res = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'supplier_profiles'
    `);
    console.log(res);
  } catch(e) {
    console.error(e.message);
  }
} 
run().finally(() => prisma.$disconnect());
