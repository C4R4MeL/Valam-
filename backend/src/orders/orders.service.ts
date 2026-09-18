import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';

type CheckoutLineItem = {
  product_id: string | null;
  circular_product_id: string | null;
  quantity_kg: number;
  price_per_kg: number;
  subtotal: number;
  supplier_id: string;
  name: string;
  cart_item_id?: string;
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService
  ) {}

  /**
   * Create order(s) + Midtrans Snap when buyer clicks Pay.
   * - Cart checkout: items from cart (multi-supplier → one order per supplier)
   * - Buy Now (direct): single product from body, cart not required
   * - Stock is NOT decremented here — only after payment = paid
   * - Cart is NOT cleared here — cleared after payment = paid
   */
  async checkout(userId: string, data: any) {
    const lineItems = await this.resolveCheckoutItems(userId, data);

    if (lineItems.length === 0) {
      throw new BadRequestException('Tidak ada produk untuk di-checkout');
    }

    // Validate stock & MOQ without reserving
    for (const item of lineItems) {
      await this.assertStockAvailable(item);
    }

    const shippingCost = Number(data.shipping_cost) || 0;
    const shippingAddress = data.shipping_address
      ? { address: data.shipping_address }
      : {};

    // Group by supplier (schema: one supplier per order)
    const bySupplier = new Map<string, CheckoutLineItem[]>();
    for (const item of lineItems) {
      const list = bySupplier.get(item.supplier_id) || [];
      list.push(item);
      bySupplier.set(item.supplier_id, list);
    }

    const buyer = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    const customerDetails = {
      firstName: buyer?.profile?.contact_person || 'Buyer',
      lastName: '',
      email: buyer?.email,
      phone: buyer?.profile?.phone || '08123456789',
    };

    const createdOrders: Array<{
      orderId: string;
      orderNumber: string;
      snapToken: string;
      redirectUrl: string;
      supplierId: string;
      amount: number;
    }> = [];

    const supplierIds = [...bySupplier.keys()];
    let supplierIndex = 0;

    for (const [supplierId, items] of bySupplier) {
      const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
      // Split shipping equally across supplier orders (MVP)
      const orderShipping =
        supplierIds.length === 1
          ? shippingCost
          : Math.round(shippingCost / supplierIds.length);

      const orderNumber = `ORD-${Date.now()}-${supplierIndex + 1}`;
      supplierIndex += 1;

      const order = await this.prisma.order.create({
        data: {
          order_number: orderNumber,
          buyer_id: userId,
          supplier_id: supplierId,
          total_amount: subtotal,
          shipping_cost: orderShipping,
          shipping_address: {
            ...shippingAddress,
            // Track cart item ids so webhook can clear only purchased lines
            cart_item_ids: items
              .map((i) => i.cart_item_id)
              .filter((id): id is string => Boolean(id)),
            checkout_mode: data.direct ? 'direct' : 'cart',
          },
          status: 'PENDING', // fulfillment queue (starts after paid)
          payment_status: 'pending',
          items: {
            create: items.map((item) => ({
              product_id: item.product_id,
              circular_product_id: item.circular_product_id,
              quantity_kg: item.quantity_kg,
              price_per_kg: item.price_per_kg,
              subtotal: item.subtotal,
            })),
          },
        },
      });

      await this.prisma.shipment.create({
        data: {
          order_id: order.id,
          shipment_type:
            data.shipping_method === 'OCEAN_FREIGHT' ? 'EKSPOR' : 'DOMESTIK',
          courier_name:
            data.shipping_courier === 'jne_jtr'
              ? 'JNE JTR'
              : data.shipping_courier === 'sea_freight'
                ? 'Sea Freight Cargo'
                : 'Biteship Cargo (Truk)',
          courier_code: data.shipping_courier || 'cargo_truck',
          total_shipping_cost: orderShipping,
          actual_weight: items.reduce((acc, item) => acc + item.quantity_kg, 0),
          origin_address: {},
          destination_address: {},
        },
      });

      const payment = await this.prisma.payment.create({
        data: {
          order_id: order.id,
          amount: subtotal + orderShipping,
          status: 'pending',
          payment_method: data.payment_method || 'ESCROW',
        },
      });

      const paymentItems = items.map((item) => ({
        id: item.product_id || item.circular_product_id!,
        price: item.price_per_kg,
        quantity: item.quantity_kg,
        name: item.name,
      }));

      if (orderShipping > 0) {
        paymentItems.push({
          id: 'shipping-fee',
          price: orderShipping,
          quantity: 1,
          name: 'Biaya Pengiriman Kargo',
        });
      }

      const snapResult = await this.paymentService.createTransaction(
        order.id,
        subtotal + orderShipping,
        customerDetails,
        paymentItems,
      );

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { snap_token: snapResult.token },
      });

      createdOrders.push({
        orderId: order.id,
        orderNumber: order.order_number,
        snapToken: snapResult.token,
        redirectUrl: snapResult.redirect_url,
        supplierId,
        amount: subtotal + orderShipping,
      });

      this.logger.log(
        `Checkout order created (awaiting payment): ${order.id} supplier=${supplierId}`,
      );
    }

    // Backward-compatible primary fields = first order
    const primary = createdOrders[0];

    return {
      orderId: primary.orderId,
      orderNumber: primary.orderNumber,
      snapToken: primary.snapToken,
      redirectUrl: primary.redirectUrl,
      orders: createdOrders,
      payment_status: 'pending',
    };
  }

  private async resolveCheckoutItems(
    userId: string,
    data: any,
  ): Promise<CheckoutLineItem[]> {
    // ── Buy Now / direct ─────────────────────────────────────
    if (data.direct === true || data.direct === 'true') {
      const productId = data.product_id;
      const quantity = Number(data.quantity_kg);
      if (!productId || !quantity || quantity <= 0) {
        throw new BadRequestException(
          'product_id dan quantity_kg wajib untuk Buy Now',
        );
      }

      const isCircular =
        data.is_circular === true ||
        data.type === 'circular' ||
        data.product_type === 'circular';

      if (isCircular) {
        const cp = await this.prisma.circularProduct.findUnique({
          where: { id: productId },
        });
        if (!cp) throw new NotFoundException('Produk sirkular tidak ditemukan');
        if (!['APPROVED', 'VERIFIED'].includes(cp.status)) {
          throw new BadRequestException('Produk belum tersedia untuk dibeli');
        }
        return [
          {
            product_id: null,
            circular_product_id: cp.id,
            quantity_kg: quantity,
            price_per_kg: cp.price,
            subtotal: quantity * cp.price,
            supplier_id: cp.supplier_id,
            name: cp.name,
          },
        ];
      }

      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });
      if (!product) {
        // Fallback: try circular if not flagged
        const cp = await this.prisma.circularProduct.findUnique({
          where: { id: productId },
        });
        if (cp) {
          return [
            {
              product_id: null,
              circular_product_id: cp.id,
              quantity_kg: quantity,
              price_per_kg: cp.price,
              subtotal: quantity * cp.price,
              supplier_id: cp.supplier_id,
              name: cp.name,
            },
          ];
        }
        throw new NotFoundException('Produk tidak ditemukan');
      }
      if (!['APPROVED', 'VERIFIED'].includes(product.status)) {
        throw new BadRequestException('Produk belum tersedia untuk dibeli');
      }

      return [
        {
          product_id: product.id,
          circular_product_id: null,
          quantity_kg: quantity,
          price_per_kg: product.price_per_kg,
          subtotal: quantity * product.price_per_kg,
          supplier_id: product.supplier_id,
          name: `Minyak Nilam Batch ${product.batch_code}`,
        },
      ];
    }

    // ── Cart checkout ────────────────────────────────────────
    const cartItems = await this.prisma.cartItem.findMany({
      where: { user_id: userId },
      include: { product: true, circular_product: true },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('Keranjang kosong');
    }

    return cartItems.map((item) => {
      if (item.product_id && item.product) {
        return {
          product_id: item.product_id,
          circular_product_id: null,
          quantity_kg: item.quantity_kg,
          price_per_kg: item.product.price_per_kg,
          subtotal: item.quantity_kg * item.product.price_per_kg,
          supplier_id: item.product.supplier_id,
          name: `Minyak Nilam Batch ${item.product.batch_code}`,
          cart_item_id: item.id,
        };
      }
      if (item.circular_product_id && item.circular_product) {
        return {
          product_id: null,
          circular_product_id: item.circular_product_id,
          quantity_kg: item.quantity_kg,
          price_per_kg: item.circular_product.price,
          subtotal: item.quantity_kg * item.circular_product.price,
          supplier_id: item.circular_product.supplier_id,
          name: item.circular_product.name,
          cart_item_id: item.id,
        };
      }
      throw new BadRequestException('Item keranjang tidak valid');
    });
  }

  private async assertStockAvailable(item: CheckoutLineItem) {
    if (item.product_id) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.product_id },
      });
      if (!product) throw new NotFoundException('Produk tidak ditemukan');
      if (item.quantity_kg > product.available_volume_kg) {
        throw new BadRequestException(
          `Stok tidak cukup untuk batch ${product.batch_code}`,
        );
      }
      if (product.moq_kg && item.quantity_kg < product.moq_kg) {
        throw new BadRequestException(
          `Minimum order ${product.moq_kg} kg untuk batch ${product.batch_code}`,
        );
      }
    } else if (item.circular_product_id) {
      const cp = await this.prisma.circularProduct.findUnique({
        where: { id: item.circular_product_id },
      });
      if (!cp) throw new NotFoundException('Produk sirkular tidak ditemukan');
      if (item.quantity_kg > cp.stock) {
        throw new BadRequestException(`Stok tidak cukup untuk ${cp.name}`);
      }
    }
  }

  async getBuyerOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { buyer_id: userId },
      include: {
        items: {
          include: { product: true, circular_product: true },
        },
        payment: true,
        shipment: {
          include: {
            tracking_logs: {
              orderBy: { created_at: 'desc' },
            },
          },
        },
        supplier: { include: { profile: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getSupplierOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { supplier_id: userId },
      include: {
        items: {
          include: { product: true, circular_product: true },
        },
        payment: true,
        shipment: {
          include: {
            tracking_logs: {
              orderBy: { created_at: 'desc' },
            },
          },
        },
        buyer: { include: { profile: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async updateOrderStatus(
    supplierId: string,
    orderId: string,
    status: string,
    note?: string,
    delivery_proof_url?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.supplier_id !== supplierId) {
      throw new BadRequestException('Unauthorized to update this order');
    }

    if (order.payment_status !== 'paid' && status !== 'CANCELLED') {
      throw new BadRequestException(
        'Pesanan belum dibayar — tidak dapat diproses fulfillment',
      );
    }

    const validStatuses = ['PENDING', 'PACKED', 'SHIPPED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    if (status === 'COMPLETED' && !delivery_proof_url) {
      throw new BadRequestException(
        'Bukti foto barang sampai wajib diunggah sebelum menandai pesanan selesai.',
      );
    }

    const updateData: any = { status };
    if (status === 'COMPLETED' && delivery_proof_url) {
      updateData.delivery_proof_url = delivery_proof_url;
    }
    if (status === 'CANCELLED') {
      updateData.payment_status = 'cancelled';
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    // Restore stock only if it was already decremented (paid then cancelled)
    if (status === 'CANCELLED' && order.payment_status === 'paid') {
      const orderWithItems = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (orderWithItems?.items) {
        for (const item of orderWithItems.items) {
          if (item.product_id) {
            await this.prisma.product.update({
              where: { id: item.product_id },
              data: { available_volume_kg: { increment: item.quantity_kg } },
            });
          } else if (item.circular_product_id) {
            await this.prisma.circularProduct.update({
              where: { id: item.circular_product_id },
              data: { stock: { increment: item.quantity_kg } },
            });
          }
        }
      }
    }

    const shipment = await this.prisma.shipment.findUnique({
      where: { order_id: orderId },
    });
    if (shipment) {
      await this.prisma.shipmentTrackingLog.create({
        data: {
          shipment_id: shipment.id,
          status: status,
          description: note || `Pesanan diubah statusnya menjadi ${status}`,
        },
      });
    }

    if (status === 'COMPLETED') {
      await this.addFundsToWallet(supplierId, order.total_amount, order.id);
    }

    return updatedOrder;
  }

  private async addFundsToWallet(
    supplierId: string,
    amount: number,
    orderId: string,
  ) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { user_id: supplierId },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { user_id: supplierId, balance: 0 },
      });
    }

    await this.prisma.walletTransaction.create({
      data: {
        wallet_id: wallet.id,
        type: 'CREDIT',
        amount: amount,
        description: `Pembayaran Pesanan #${orderId.substring(0, 8)}`,
      },
    });

    await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: amount } },
    });
  }

  async updateOrderShipping(
    userId: string,
    orderId: string,
    data: { shipping_address: string; shipping_cost: number },
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.buyer_id !== userId) throw new ForbiddenException('Not your order');

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        shipping_cost: data.shipping_cost,
        shipping_address: { address: data.shipping_address },
      },
    });
  }

  /**
   * Retry payment for an existing pending/failed order.
   */
  async retryPayment(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true, circular_product: true } },
        payment: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.buyer_id !== userId) throw new ForbiddenException('Not your order');

    const paidStatuses = ['paid', 'COMPLETED', 'PAID'];
    if (
      paidStatuses.includes(order.payment_status) ||
      paidStatuses.includes(order.payment?.status || '')
    ) {
      throw new BadRequestException('Order is already paid');
    }

    if (
      order.payment?.snap_token &&
      ['pending', 'PENDING'].includes(order.payment.status) &&
      !order.payment.snap_token.startsWith('mock-')
    ) {
      return {
        orderId: order.id,
        snapToken: order.payment.snap_token,
      };
    }

    const buyer = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    const customerDetails = {
      firstName: buyer?.profile?.contact_person || 'Buyer',
      lastName: '',
      email: buyer?.email,
      phone: buyer?.profile?.phone || '08123456789',
    };

    const paymentItems = order.items.map((item) => ({
      id: item.product_id || item.circular_product_id!,
      price: item.price_per_kg,
      quantity: item.quantity_kg,
      name: item.product_id
        ? `Minyak Nilam Batch ${item.product?.batch_code || 'N/A'}`
        : `${item.circular_product?.name || 'Product'}`,
    }));

    const grossAmount = order.total_amount + order.shipping_cost;

    // Midtrans requires unique order_id — append retry suffix for new Snap
    const midtransOrderId = `${order.id}-r${Date.now()}`;

    const snapResult = await this.paymentService.createTransaction(
      midtransOrderId,
      grossAmount,
      customerDetails,
      paymentItems,
    );

    if (order.payment) {
      await this.prisma.payment.update({
        where: { id: order.payment.id },
        data: {
          snap_token: snapResult.token,
          status: 'pending',
          payment_gateway_id: midtransOrderId,
        },
      });
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: { payment_status: 'pending' },
    });

    this.logger.log(`Retry payment token generated for order ${orderId}`);

    return {
      orderId: order.id,
      snapToken: snapResult.token,
      redirectUrl: snapResult.redirect_url,
    };
  }

  async completeOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyer_id !== userId) throw new ForbiddenException('Not your order');

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' },
    });

    const shipment = await this.prisma.shipment.findFirst({
      where: { order_id: orderId },
    });
    if (shipment) {
      await this.prisma.shipmentTrackingLog.create({
        data: {
          shipment_id: shipment.id,
          status: 'COMPLETED',
          description:
            'Pesanan telah diterima oleh pembeli. Transaksi berhasil diselesaikan.',
        },
      });
    }

    await this.addFundsToWallet(order.supplier_id, order.total_amount, order.id);

    return updated;
  }

  async resetOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.buyer_id !== userId && order.supplier_id !== userId) {
      throw new ForbiddenException('Not your order');
    }

    const shipment = await this.prisma.shipment.findFirst({
      where: { order_id: orderId },
    });
    if (shipment) {
      await this.prisma.shipmentTrackingLog.deleteMany({
        where: { shipment_id: shipment.id },
      });
      await this.prisma.shipment.delete({
        where: { id: shipment.id },
      });
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PENDING',
        shipping_cost: 0,
        shipping_address: {},
        payment_status: 'pending',
      },
    });

    await this.prisma.payment.updateMany({
      where: { order_id: orderId },
      data: {
        status: 'pending',
        payment_method: null,
        paid_at: null,
      },
    });

    return updated;
  }
}
