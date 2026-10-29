import { Injectable, Logger, ForbiddenException, UnauthorizedException, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import { MidtransGateway } from './midtrans.gateway';
import { CommerceService, rupiah } from '../commerce/commerce.service';

@Injectable()
export class PaymentService {
  private snap: any;
  private readonly logger = new Logger(PaymentService.name);
  private readonly isProduction: boolean;
  private readonly serverKey: string;

  constructor(private prisma: PrismaService, private readonly gateway: MidtransGateway, private readonly commerce: CommerceService) {
    this.isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    this.serverKey = process.env.MIDTRANS_SERVER_KEY || '';

    this.snap = this.gateway;
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
        price: Math.round(item.price * item.quantity),
        quantity: 1,
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
    if (typeof signatureKey !== 'string' || !/^[a-fA-F0-9]{128}$/.test(signatureKey)) return false;
    return crypto.timingSafeEqual(Buffer.from(expectedSignature, 'hex'), Buffer.from(signatureKey, 'hex'));
  }

  async handleNotification(input: any): Promise<{ success: true }> {
    if (!this.serverKey) throw new ServiceUnavailableException('Payment webhook key is not configured');
    if (typeof input.order_id !== 'string' || typeof input.status_code !== 'string' || typeof input.gross_amount !== 'string' ||
        !this.verifySignatureKey(input.order_id, input.status_code, input.gross_amount, input.signature_key)) {
      throw new UnauthorizedException('Invalid payment notification signature');
    }
    const payment = await this.prisma.payment.findUnique({ where: { gateway_order_id: input.order_id } });
    if (!payment) throw new BadRequestException('Unknown payment attempt');
    // The body signature does not cover every status field. Read authoritative gateway status.
    const verified = await this.gateway.status(input.order_id);
    if (verified.order_id !== payment.gateway_order_id || verified.currency && verified.currency !== 'IDR') throw new BadRequestException('Payment reference mismatch');
    if (!/^\d+(?:\.0{1,2})?$/.test(String(verified.gross_amount)) ||
        Number(verified.gross_amount) !== rupiah(payment.amount) || Number(input.gross_amount) !== rupiah(payment.amount)) throw new BadRequestException('Payment amount mismatch');
    const state = verified.transaction_status;
    return this.commerce.withOrder(payment.order_id, async (tx, order) => {
      if (!order.payment || order.payment.id !== payment.id || order.payment.gateway_order_id !== input.order_id) throw new BadRequestException('Payment relation mismatch');
      const current = order.payment.status;
      if (state === 'refund' || state === 'partial_refund') {
        if (current === 'refunded') return { success: true };
        if (!['paid', 'partial_refunded'].includes(current)) throw new BadRequestException('Refund requires a confirmed payment');
        if (state === 'partial_refund') {
          await tx.payment.update({ where: { id: payment.id }, data: { status: 'partial_refunded' } });
          await tx.order.update({ where: { id: order.id }, data: { status: 'REFUND_REVIEW', payment_status: 'partial_refunded' } });
          await tx.wallet.updateMany({ where: { user_id: order.supplier_id }, data: { frozen: true } });
          return { success: true };
        }
        if (['PENDING', 'PACKED', 'REFUND_REQUESTED'].includes(order.status)) await this.commerce.release(tx, order, true);
        await this.commerce.lock(tx, 'wallet:' + order.supplier_id);
        const wallet = await tx.wallet.findUnique({ where: { user_id: order.supplier_id } });
        const credit = await tx.walletTransaction.findUnique({ where: { reference_order_id_type: { reference_order_id: order.id, type: 'CREDIT' } } });
        if (wallet && credit) {
          const amount = Number(credit.amount);
          const available = Math.min(Number(wallet.balance), amount);
          await tx.walletTransaction.create({ data: { wallet_id: wallet.id, type: 'REFUND_DEBIT', amount, reference_order_id: order.id, description: 'Refund penuh dikonfirmasi gateway; saldo/kewajiban disesuaikan' } });
          await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: available }, refund_due: { increment: amount - available }, frozen: true } });
        }
        await tx.payment.update({ where: { id: payment.id }, data: { status: 'refunded' } });
        await tx.order.update({ where: { id: order.id }, data: { status: 'REFUNDED', payment_status: 'refunded' } });
        return { success: true };
      }
      // A delayed pending/failure notification cannot downgrade settled money.
      if (['paid', 'refunded', 'partial_refunded'].includes(current)) return { success: true };
      const paid = state === 'settlement' || state === 'capture' && verified.fraud_status === 'accept';
      if (paid) {
        if (order.stock_state !== 'RESERVED' || order.reservation_expires_at && order.reservation_expires_at < new Date() || order.status !== 'PENDING') {
          await this.commerce.release(tx, order);
          await tx.payment.update({ where: { id: payment.id }, data: { status: 'paid', paid_at: new Date() } });
          await tx.order.update({ where: { id: order.id }, data: { status: 'PAYMENT_REVIEW', payment_status: 'paid' } });
          return { success: true };
        }
        await tx.payment.update({ where: { id: payment.id }, data: { status: 'paid', paid_at: new Date(), payment_method: verified.payment_type || null, payment_gateway_id: verified.transaction_id || null } });
        await tx.order.update({ where: { id: order.id }, data: { payment_status: 'paid', stock_state: 'CONSUMED' } });
        const address = order.shipping_address as any;
        if (Array.isArray(address?.cart_item_ids)) await tx.cartItem.deleteMany({ where: { user_id: order.buyer_id, id: { in: address.cart_item_ids.filter((v: unknown) => typeof v === 'string') } } });
      } else if (['expire', 'cancel', 'deny', 'failure'].includes(state)) {
        await this.commerce.release(tx, order);
        const status = state === 'expire' ? 'expired' : state === 'cancel' ? 'cancelled' : 'failed';
        await tx.payment.update({ where: { id: payment.id }, data: { status } });
        await tx.order.update({ where: { id: order.id }, data: { payment_status: status, status: state === 'expire' ? 'EXPIRED' : 'CANCELLED' } });
      }
      return { success: true };
    });
  }

  async getPaymentStatus(orderId: string, buyerId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      return null;
    }
    if (order.buyer_id !== buyerId) throw new ForbiddenException('Not your order');

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

}
