import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { Prisma, Order, Payment } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { createHash } from 'node:crypto';

type Tx = Prisma.TransactionClient;
type Line = {
  product_id: string | null;
  circular_product_id: string | null;
  quantity_kg: number;
  price_per_kg: number;
};

export function rupiah(value: number): number {
  const rounded = Math.round(value);
  if (!Number.isFinite(value) || !Number.isSafeInteger(rounded) || rounded <= 0)
    throw new BadRequestException('Nominal harus positif dan valid');
  return rounded;
}

@Injectable()
export class CommerceService {
  constructor(private readonly prisma: PrismaService) {}

  async lock(tx: Tx, key: string) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
  }

  async withOrder<T>(
    id: string,
    action: (
      tx: Tx,
      order: Order & { items: Line[]; payment: Payment | null },
    ) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(
      async (tx) => {
        await this.lock(tx, `order:${id}`);
        const order = await tx.order.findUnique({
          where: { id },
          include: { items: true, payment: true },
        });
        if (!order) throw new NotFoundException('Order not found');
        return action(tx, order);
      },
      { timeout: 30000, maxWait: 10000 },
    );
  }

  async reserve(tx: Tx, lines: Line[], supplierId: string) {
    for (const line of [...lines].sort((a, b) =>
      String(a.product_id || a.circular_product_id).localeCompare(
        String(b.product_id || b.circular_product_id),
      ),
    )) {
      if (
        !Number.isFinite(line.quantity_kg) ||
        line.quantity_kg <= 0 ||
        !Number.isFinite(line.price_per_kg) ||
        line.price_per_kg <= 0 ||
        Boolean(line.product_id) === Boolean(line.circular_product_id)
      ) {
        throw new BadRequestException('Item pesanan tidak valid');
      }
      let count = 0;
      if (line.product_id) {
        const product = await tx.product.findUnique({
          where: { id: line.product_id },
        });
        if (!product || line.quantity_kg < product.moq_kg)
          throw new BadRequestException('Batch atau MOQ tidak valid');
        count = (
          await tx.product.updateMany({
            where: {
              id: line.product_id,
              supplier_id: supplierId,
              status: 'VERIFIED',
              available_volume_kg: { gte: line.quantity_kg },
            },
            data: { available_volume_kg: { decrement: line.quantity_kg } },
          })
        ).count;
      } else {
        count = (
          await tx.circularProduct.updateMany({
            where: {
              id: line.circular_product_id!,
              supplier_id: supplierId,
              status: 'APPROVED',
              stock: { gte: line.quantity_kg },
            },
            data: { stock: { decrement: line.quantity_kg } },
          })
        ).count;
      }
      if (count !== 1)
        throw new ConflictException(
          'Stok tidak cukup atau batch tidak tersedia',
        );
    }
  }

  async createReservedOrder(
    data: Prisma.OrderUncheckedCreateInput,
    lines: Line[],
    key: string,
  ) {
    if (!key || key.length > 200)
      throw new BadRequestException('Idempotency key wajib disertakan');
    const fingerprint = createHash('sha256')
      .update(
        JSON.stringify({
          lines,
          total: data.total_amount,
          shipping: data.shipping_cost,
          address: data.shipping_address,
        }),
      )
      .digest('hex');
    return this.prisma.$transaction(
      async (tx) => {
        await this.lock(tx, `checkout:${key}`);
        const existing = await tx.order.findUnique({
          where: { checkout_key: key },
          include: { payment: true },
        });
        if (existing) {
          if (
            existing.buyer_id !== data.buyer_id ||
            existing.checkout_fingerprint !== fingerprint
          )
            throw new ConflictException(
              'Idempotency key telah dipakai untuk kesepakatan berbeda',
            );
          return { order: existing, created: false };
        }
        await this.reserve(tx, lines, data.supplier_id);
        const order = await tx.order.create({
          data: {
            ...data,
            status: 'PENDING',
            payment_status: 'pending',
            checkout_key: key,
            checkout_fingerprint: fingerprint,
            stock_state: 'RESERVED',
            reservation_expires_at: new Date(Date.now() + 30 * 60 * 1000),
          },
          include: { payment: true },
        });
        return { order, created: true };
      },
      { timeout: 30000, maxWait: 10000 },
    );
  }

  async release(
    tx: Tx,
    order: Order & { items: Line[] },
    allowConsumed = false,
  ) {
    if (
      order.stock_state !== 'RESERVED' &&
      !(allowConsumed && order.stock_state === 'CONSUMED')
    )
      return;
    for (const item of order.items) {
      if (item.product_id)
        await tx.product.update({
          where: { id: item.product_id },
          data: { available_volume_kg: { increment: item.quantity_kg } },
        });
      else if (item.circular_product_id)
        await tx.circularProduct.update({
          where: { id: item.circular_product_id },
          data: { stock: { increment: item.quantity_kg } },
        });
    }
    await tx.order.update({
      where: { id: order.id },
      data: { stock_state: 'RELEASED' },
    });
  }

  async complete(buyerId: string, orderId: string) {
    return this.withOrder(orderId, async (tx, order) => {
      if (order.buyer_id !== buyerId)
        throw new ForbiddenException('Not your order');
      if (order.status === 'COMPLETED') return order;
      if (
        order.status !== 'SHIPPED' ||
        order.payment_status !== 'paid' ||
        order.stock_state !== 'CONSUMED'
      )
        throw new BadRequestException(
          'Hanya pesanan dibayar dan dikirim yang dapat diterima buyer',
        );
      const shipment = await tx.shipment.findUnique({
        where: { order_id: order.id },
      });
      if (shipment && ['BERMASALAH', 'DIBATALKAN'].includes(shipment.status))
        throw new BadRequestException('Kendala pengiriman belum diselesaikan');
      await this.lock(tx, `wallet:${order.supplier_id}`);
      const wallet = await tx.wallet.upsert({
        where: { user_id: order.supplier_id },
        update: {},
        create: { user_id: order.supplier_id },
      });
      const amount = rupiah(order.total_amount);
      const credit = await tx.walletTransaction.findUnique({
        where: {
          reference_order_id_type: {
            reference_order_id: order.id,
            type: 'CREDIT',
          },
        },
      });
      if (!credit) {
        await tx.walletTransaction.create({
          data: {
            wallet_id: wallet.id,
            type: 'CREDIT',
            amount,
            reference_order_id: order.id,
            description: 'Penerimaan barang dikonfirmasi buyer',
          },
        });
        const offset = Math.min(Number(wallet.refund_due), amount);
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { increment: amount - offset },
            refund_due: { decrement: offset },
          },
        });
      }
      await tx.shipment.updateMany({
        where: { order_id: order.id },
        data: {
          status: 'SELESAI',
          completed_at: new Date(),
          delivered_at: new Date(),
        },
      });
      return tx.order.update({
        where: { id: order.id },
        data: { status: 'COMPLETED' },
      });
    });
  }

  async supplierTransition(
    supplierId: string,
    id: string,
    status: string,
    proof?: string,
  ) {
    return this.withOrder(id, async (tx, order) => {
      if (order.supplier_id !== supplierId)
        throw new ForbiddenException('Not your order');
      if (status === 'COMPLETED')
        throw new ForbiddenException(
          'Penerimaan dan pencairan harus dikonfirmasi buyer',
        );
      if (
        proof &&
        (proof.length > 7_000_000 ||
          (!/^https:\/\//.test(proof) &&
            !proof.startsWith('/uploads/') &&
            !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(
              proof,
            )))
      )
        throw new BadRequestException('Bukti pengiriman tidak valid');
      if (status === order.status) {
        if (proof && order.status === 'SHIPPED')
          return tx.order.update({
            where: { id },
            data: { delivery_proof_url: proof },
          });
        return order;
      }
      if (status === 'CANCELLED') {
        if (
          ['SHIPPED', 'COMPLETED', 'REFUNDED', 'REFUND_REVIEW'].includes(
            order.status,
          )
        )
          throw new BadRequestException(
            'Status pesanan tidak dapat dibatalkan',
          );
        if (order.payment_status === 'paid')
          return tx.order.update({
            where: { id },
            data: { status: 'REFUND_REQUESTED' },
          });
        await this.release(tx, order);
        await tx.payment.updateMany({
          where: { order_id: id },
          data: { status: 'cancelled' },
        });
        await tx.shipment.updateMany({
          where: { order_id: id },
          data: { status: 'DIBATALKAN' },
        });
        return tx.order.update({
          where: { id },
          data: { status: 'CANCELLED', payment_status: 'cancelled' },
        });
      }
      const next: Record<string, string> = {
        PENDING: 'PACKED',
        PACKED: 'SHIPPED',
      };
      if (
        order.payment_status !== 'paid' ||
        order.stock_state !== 'CONSUMED' ||
        next[order.status] !== status
      )
        throw new BadRequestException('Transisi pesanan tidak sah');
      return tx.order.update({
        where: { id },
        data: { status, ...(proof ? { delivery_proof_url: proof } : {}) },
      });
    });
  }

  @Interval(60000)
  async expireReservations() {
    const candidates = await this.prisma.order.findMany({
      where: {
        stock_state: 'RESERVED',
        payment_status: 'pending',
        reservation_expires_at: { lte: new Date() },
      },
      select: { id: true },
      take: 100,
    });
    for (const candidate of candidates)
      await this.withOrder(candidate.id, async (tx, order) => {
        if (
          order.stock_state !== 'RESERVED' ||
          order.payment_status !== 'pending' ||
          !order.reservation_expires_at ||
          order.reservation_expires_at > new Date()
        )
          return;
        await this.release(tx, order);
        await tx.payment.updateMany({
          where: { order_id: order.id },
          data: { status: 'expired' },
        });
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'EXPIRED', payment_status: 'expired' },
        });
      });
  }
}
