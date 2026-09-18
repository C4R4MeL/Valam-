const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function cleanAllOrders() {
  console.log('Deleting all test orders...');
  
  // Delete related records first
  await prisma.shipmentTrackingLog.deleteMany({});
  await prisma.shipment.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.order.deleteMany({});

  console.log('All orders deleted.');
}

cleanAllOrders().catch(console.error).finally(() => prisma.$disconnect());
