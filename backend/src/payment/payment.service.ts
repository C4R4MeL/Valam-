import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
const midtransClient = require('midtrans-client');

@Injectable()
export class PaymentService {
  private snap: any;
  private readonly logger = new Logger(PaymentService.name);
  private readonly isProduction: boolean;
  private readonly serverKey: string;

  constructor(private prisma: PrismaService) {
    this.isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    this.serverKey = process.env.MIDTRANS_SERVER_KEY || '';

    this.snap = new midtransClient.Snap({
      isProduction: this.isProduction,
      serverKey: this.serverKey,
      clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
    });
  }

  /**
   * Create a Midtrans Snap transaction and return token + redirect_url.
   */
  async createTransaction(
    orderId: string,
    grossAmount: number,
    customerDetails: any,
    items: any[],
  ): Promise<{ token: string; redirect_url: string }> {
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(grossAmount),
      },
      credit_card: {
        secure: true,
      },
      customer_details: {
        first_name: customerDetails.firstName,
        last_name: customerDetails.lastName,
        email: customerDetails.email,
        phone: customerDetails.phone,
      },
      item_details: items.map((item) => ({
        id: String(item.id).substring(0, 50),
        price: Math.round(item.price),
        quantity: item.quantity,
        name: String(item.name).substring(0, 50),
      })),
    };

    try {
      const transaction = await this.snap.createTransaction(parameter);
      this.logger.log(`Snap token created for order ${orderId}`);
      return {
        token: transaction.token,
        redirect_url: transaction.redirect_url,
      };
    } catch (e: any) {
      this.logger.error(
        `Midtrans createTransaction failed for order ${orderId}: ${e.message}`,
      );
      throw new Error(`Payment gateway error: ${e.message}`);
    }
  }

  verifySignatureKey(
    orderId: string,
    statusCode: string,
    grossAmount: string,
    signatureKey: string,
  ): boolean {
    const payload = orderId + statusCode + grossAmount + this.serverKey;
    const expectedSignature = crypto
      .createHash('sha512')
      .update(payload)
      .digest('hex');
    return expectedSignature === signatureKey;
  }

  /**
   * Resolve our Order from Midtrans order_id (supports retry suffix `-r{timestamp}`).
   */
  private async findOrderByMidtransId(midtransOrderId: string) {
    let order = await this.prisma.order.findUnique({
      where: { id: midtransOrderId },
      include: { payment: true, items: true },
    });
    if (order) return order;

    // Retry payments store midtrans id on payment.payment_gateway_id
    const payment = await this.prisma.payment.findFirst({
      where: { payment_gateway_id: midtransOrderId },
      include: { order: { include: { payment: true, items: true } } },
    });
    if (payment?.order) {
      return { ...payment.order, payment, items: payment.order.items };
    }

    // Strip retry suffix: {uuid}-r{timestamp}
    const baseId = midtransOrderId.replace(/-r\d+$/, '');
    if (baseId !== midtransOrderId) {
      order = await this.prisma.order.findUnique({
        where: { id: baseId },
        include: { payment: true, items: true },
      });
    }
    return order;
  }

  /**
   * Handle Midtrans webhook — idempotent.
   * Payment lifecycle: pending → paid | failed | cancelled
   * Stock decremented + cart cleared only when paid.
   */
  async handleNotification(notificationData: any): Promise<{ success: true }> {
    const midtransOrderId = notificationData.order_id;
    const transactionStatus = notificationData.transaction_status;
    const fraudStatus = notificationData.fraud_status;
    const signatureKey = notificationData.signature_key;
    const statusCode = notificationData.status_code;
    const grossAmount = notificationData.gross_amount;

    this.logger.log(
      `Webhook received: order=${midtransOrderId}, status=${transactionStatus}, fraud=${fraudStatus}`,
    );

    if (signatureKey && this.serverKey) {
      const isValid = this.verifySignatureKey(
        midtransOrderId,
        statusCode,
        grossAmount,
        signatureKey,
      );
      if (!isValid) {
        this.logger.warn(
          `Invalid signature for order ${midtransOrderId} — ignoring`,
        );
        return { success: true };
      }
    }

    const order = await this.findOrderByMidtransId(midtransOrderId);

    if (!order) {
      this.logger.warn(
        `Order ${midtransOrderId} not found — acknowledging webhook`,
      );
      return { success: true };
    }

    const orderId = order.id;
    const currentPaymentStatus = (order.payment?.status || '').toLowerCase();
    const currentOrderPayment = (order.payment_status || '').toLowerCase();

    // Terminal states
    if (
      currentPaymentStatus === 'paid' ||
      currentPaymentStatus === 'completed' ||
      currentOrderPayment === 'paid' ||
      currentPaymentStatus === 'refunded'
    ) {
      this.logger.log(
        `Order ${orderId} payment already terminal — skipping`,
      );
      return { success: true };
    }

    // Map Midtrans → pending | paid | failed | cancelled
    let paymentStatus: 'pending' | 'paid' | 'failed' | 'cancelled' = 'pending';

    if (transactionStatus === 'capture') {
      paymentStatus = fraudStatus === 'accept' ? 'paid' : 'pending';
    } else if (transactionStatus === 'settlement') {
      paymentStatus = 'paid';
    } else if (transactionStatus === 'cancel') {
      paymentStatus = 'cancelled';
    } else if (
      transactionStatus === 'deny' ||
      transactionStatus === 'expire'
    ) {
      paymentStatus = 'failed';
    } else if (transactionStatus === 'pending') {
      paymentStatus = 'pending';
    } else if (
      transactionStatus === 'refund' ||
      transactionStatus === 'partial_refund'
    ) {
      // Treat refund as cancelled for buyer-facing payment_status
      paymentStatus = 'cancelled';
    }

    const wasUnpaid = !['paid', 'completed'].includes(currentOrderPayment);

    if (order.payment) {
      const updateData: any = {
        status: paymentStatus,
        payment_method:
          notificationData.payment_type || order.payment.payment_method,
        payment_gateway_id:
          notificationData.transaction_id ||
          order.payment.payment_gateway_id ||
          midtransOrderId,
      };

      if (paymentStatus === 'paid') {
        updateData.paid_at = new Date();
      }

      await this.prisma.payment.update({
        where: { id: order.payment.id },
        data: updateData,
      });
    }

    // Fulfillment status stays PENDING until supplier processes;
    // only update payment_status here.
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        payment_status: paymentStatus,
        // Keep fulfillment PENDING after paid so supplier can pack
        ...(paymentStatus === 'paid' ? { status: 'PENDING' } : {}),
      },
    });

    // On first successful payment: decrement stock + clear related cart items
    if (paymentStatus === 'paid' && wasUnpaid) {
      await this.decrementStock(orderId);
      await this.clearPurchasedCartItems(order);
    }

    this.logger.log(
      `Order ${orderId} updated: payment_status=${paymentStatus}`,
    );

    return { success: true };
  }

  async getPaymentStatus(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      return null;
    }

    const raw = order.payment?.status || order.payment_status || 'pending';
    // Normalize legacy uppercase for frontend
    const normalized = String(raw).toLowerCase();
    const paymentStatus =
      normalized === 'completed' ? 'paid' : normalized;

    return {
      orderId: order.id,
      orderNumber: order.order_number,
      orderStatus: order.status,
      paymentStatus,
      paymentMethod: order.payment?.payment_method || null,
      amount: order.payment?.amount || order.total_amount,
      paidAt: order.payment?.paid_at || null,
    };
  }

  private async decrementStock(orderId: string) {
    const orderWithItems = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!orderWithItems?.items) return;

    for (const item of orderWithItems.items) {
      try {
        if (item.product_id) {
          await this.prisma.product.update({
            where: { id: item.product_id },
            data: {
              available_volume_kg: { decrement: item.quantity_kg },
            },
          });
        } else if (item.circular_product_id) {
          await this.prisma.circularProduct.update({
            where: { id: item.circular_product_id },
            data: {
              stock: { decrement: item.quantity_kg },
            },
          });
        }
      } catch (e: any) {
        this.logger.error(
          `Failed to decrement stock for item ${item.id}: ${e.message}`,
        );
      }
    }

    this.logger.log(`Stock decremented for paid order ${orderId}`);
  }

  private async clearPurchasedCartItems(order: {
    buyer_id: string;
    shipping_address: any;
    items?: Array<{
      product_id: string | null;
      circular_product_id: string | null;
    }>;
  }) {
    try {
      const addr = order.shipping_address as any;
      const cartItemIds: string[] = Array.isArray(addr?.cart_item_ids)
        ? addr.cart_item_ids.filter(Boolean)
        : [];

      if (cartItemIds.length > 0) {
        await this.prisma.cartItem.deleteMany({
          where: {
            user_id: order.buyer_id,
            id: { in: cartItemIds },
          },
        });
        this.logger.log(
          `Cleared ${cartItemIds.length} cart items after paid order`,
        );
        return;
      }

      // Fallback: remove cart rows matching purchased product ids
      const productIds = (order.items || [])
        .map((i) => i.product_id)
        .filter(Boolean) as string[];
      const circularIds = (order.items || [])
        .map((i) => i.circular_product_id)
        .filter(Boolean) as string[];

      if (productIds.length || circularIds.length) {
        await this.prisma.cartItem.deleteMany({
          where: {
            user_id: order.buyer_id,
            OR: [
              ...(productIds.length
                ? [{ product_id: { in: productIds } }]
                : []),
              ...(circularIds.length
                ? [{ circular_product_id: { in: circularIds } }]
                : []),
            ],
          },
        });
      }
    } catch (e: any) {
      this.logger.error(`Failed to clear cart after payment: ${e.message}`);
    }
  }
}
