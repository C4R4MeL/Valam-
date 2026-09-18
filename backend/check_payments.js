const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() { 
  const payments = await prisma.payment.findMany({ 
    where: { 
      status: { in: ['PENDING', 'FAILED', 'UNPAID', 'WAITING_FOR_PAYMENT'] } 
    } 
  }); 
  console.log(payments); 
} 

run().finally(() => prisma.$disconnect());
