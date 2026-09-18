const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function cleanOrders() {
  const mockPayments = await prisma.payment.findMany({
    where: {
      snap_token: {
        startsWith: 'mock-token'
      }
    }
  });

  console.log(`Found ${mockPayments.length} payments with mock tokens.`);

  for (const payment of mockPayments) {
    console.log(`Deleting order ${payment.order_id} with mock token...`);
    // Delete related records first
    await prisma.shipmentTrackingLog.deleteMany({
      where: {
        shipment: {
          order_id: payment.order_id
        }
      }
    });
    
    await prisma.shipment.deleteMany({
      where: {
        order_id: payment.order_id
      }
    });

    await prisma.orderItem.deleteMany({
      where: {
        order_id: payment.order_id
      }
    });

    await prisma.payment.deleteMany({
      where: {
        order_id: payment.order_id
      }
    });

    await prisma.order.delete({
      where: {
        id: payment.order_id
      }
    });
  }
  
  console.log('Cleanup complete.');
}

cleanOrders().catch(console.error).finally(() => prisma.$disconnect());
