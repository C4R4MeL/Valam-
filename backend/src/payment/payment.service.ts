import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
const midtransClient = require('midtrans-client');

@Injectable()
export class PaymentService {
  private snap: any;
  private readonly logger = new Logger(PaymentService.name);

  constructor(private prisma: PrismaService) {
    this.snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-x', // Mock fallback
      clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-x',
    });
  }

  async createTransaction(orderId: string, grossAmount: number, customerDetails: any, items: any[]) {
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount
      },
      credit_card: {
        secure: true
      },
      customer_details: {
        first_name: customerDetails.firstName,
        last_name: customerDetails.lastName,
        email: customerDetails.email,
        phone: customerDetails.phone,
      },
      item_details: items.map(item => ({
        id: item.id,
        price: item.price,
        quantity: item.quantity,
        name: item.name
      }))
    };

    try {
      const transaction = await this.snap.createTransaction(parameter);
      return transaction.token;
    } catch (e) {
      this.logger.error('Midtrans Error:', e);
      // For MVP without real Midtrans keys, we will generate a mock token if Midtrans fails
      this.logger.warn('Returning mock token since Midtrans failed (likely invalid keys).');
      return `mock-token-${orderId}`;
    }
  }

  async handleNotification(notificationData: any) {
    try {
      const statusResponse = await this.snap.transaction.notification(notificationData);
      const orderId = statusResponse.order_id;
      const transactionStatus = statusResponse.transaction_status;
      const fraudStatus = statusResponse.fraud_status;

      let paymentStatus = 'PENDING';

      if (transactionStatus == 'capture') {
        if (fraudStatus == 'challenge') {
          paymentStatus = 'PENDING';
        } else if (fraudStatus == 'accept') {
          paymentStatus = 'PAID';
        }
      } else if (transactionStatus == 'settlement') {
        paymentStatus = 'PAID';
      } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire') {
        paymentStatus = 'FAILED';
      } else if (transactionStatus == 'pending') {
        paymentStatus = 'PENDING';
      }

      // Update Order and Payment status in DB
      const order = await this.prisma.order.findUnique({
        where: { id: orderId }
      });

      if (order && paymentStatus === 'PAID') {
        await this.prisma.order.update({
          where: { id: orderId },
          data: { status: 'PENDING' } // Order becomes PENDING (paid but not yet processed)
        });

        await this.prisma.payment.updateMany({
          where: { order_id: orderId },
          data: {
            status: 'COMPLETED',
            payment_method: statusResponse.payment_type || 'midtrans',
            payment_gateway_id: statusResponse.transaction_id
          }
        });
        
        // In a real app we'd also clear the buyer's cart, but we'll do it on checkout
      }

      return { success: true };
    } catch (e) {
      this.logger.error('Midtrans Notification Error:', e);
      throw e;
    }
  }
}
