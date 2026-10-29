import { CommerceService, rupiah } from '../commerce/commerce.service';
import { randomUUID } from 'node:crypto';
import { PUBLIC_USER_SELECT } from '../users/public-user.select';
import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';
import { ShipmentService } from '../shipment/shipment.service';

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
    private paymentService: PaymentService,
    private shipmentService: ShipmentService,
    private readonly commerce: CommerceService,
  ) {}

  /**
   * Create order(s) + Midtrans Snap when buyer clicks Pay.
   * - Cart checkout: items from cart (multi-supplier → one order per supplier)
   * - Buy Now (direct): single product from body, cart not required
   * - Stock is reserved atomically before gateway setup, then consumed when paid
   * - Cart is NOT cleared here — cleared after payment = paid
   * - Shipping: server re-quotes Biteship per supplier (never trusts client cost)
   */
  async checkout(userId: string, data: any) {
    if (typeof data.idempotency_key !== 'string' || !/^[a-zA-Z0-9_-]{8,100}$/.test(data.idempotency_key)) throw new BadRequestException('Idempotency key tidak valid');
    this.paymentService.assertConfigured();
    const lineItems = await this.resolveCheckoutItems(userId, data);

    if (lineItems.length === 0) {
      throw new BadRequestException('Tidak ada produk untuk di-checkout');
    }

    // Stock and MOQ are checked atomically by createReservedOrder, after replay lookup.

    const destination = data.destinationAddress || (
      data.shipping_address
        ? {
            address: typeof data.shipping_address === 'string'
              ? data.shipping_address
              : data.shipping_address.address,
            postal_code: data.destinationPostalCode || data.shipping_address?.postal_code,
            area_id: data.destinationAreaId || data.shipping_address?.area_id,
            contact_name: data.shipping_address?.contact_name,
            phone: data.shipping_address?.phone,
          }
        : null
    );

    if (!destination?.address || (!destination.area_id && !destination.postal_code)) {
      throw new BadRequestException(
        'Alamat tujuan harus menyertakan alamat lengkap serta area_id atau kode pos.',
      );
    }

    const selectedRates: Record<string, string> = data.selectedRates || {};

    // Group by supplier (schema: one supplier per order)
    const bySupplier = new Map<string, CheckoutLineItem[]>();
    for (const item of lineItems) {
      const list = bySupplier.get(item.supplier_id) || [];
      list.push(item);
      bySupplier.set(item.supplier_id, list);
    }

    for (const supplierId of bySupplier.keys()) {
      if (!selectedRates[supplierId]) {
        throw new BadRequestException(
          `Kurir belum dipilih untuk supplier ${supplierId}`,
        );
      }
    }

    const buyer = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    const customerDetails = {
      firstName:
        destination.contact_name ||
        buyer?.profile?.contact_person ||
        'Buyer',
      lastName: '',
      email: buyer?.email,
      phone:
        destination.phone ||
        buyer?.profile?.phone ||
        '08123456789',
    };

    const createdOrders: Array<{
      orderId: string;
      orderNumber: string;
      snapToken: string;
      redirectUrl: string;
      supplierId: string;
      amount: number;
      shippingCost: number;
    }> = [];

    let supplierIndex = 0;

    for (const [supplierId, items] of bySupplier) {
      const subtotal = rupiah(items.reduce((s, i) => s + Math.round(i.subtotal), 0));

      // SERVER-SIDE RE-QUOTE — never trust client shipping_cost
      const quote = await this.shipmentService.quoteRatesForItems({
        supplierId,
        destinationAddress: destination.address,
        destinationPostalCode: destination.postal_code,
        destinationAreaId: destination.area_id,
        items: items.map((i) => ({
          productId: i.product_id,
          circularProductId: i.circular_product_id,
          quantityKg: i.quantity_kg,
        })),
      });

      const rate = quote.rates.find(
        (r) => r.rateId === selectedRates[supplierId],
      );
      if (!rate) {
        throw new BadRequestException(
          'Tarif kurir sudah berubah/kadaluarsa. Silakan pilih ulang di Step 1.',
        );
      }

      const orderShipping = rate.totalOngkir;
      const orderNumber = `ORD-${Date.now()}-${randomUUID().slice(0, 8)}`;
      supplierIndex += 1;

      const reservation = await this.commerce.createReservedOrder({
          order_number: orderNumber,
          buyer_id: userId,
          supplier_id: supplierId,
          total_amount: subtotal,
          shipping_cost: orderShipping,
          shipping_address: {
            address: destination.address,
            postal_code: destination.postal_code ?? null,
            area_id: destination.area_id ?? null,
            contact_name: destination.contact_name ?? null,
            phone: destination.phone ?? null,
            cart_item_ids: items
              .map((i) => i.cart_item_id)
              .filter((id): id is string => Boolean(id)),
            checkout_mode: data.direct ? 'direct' : 'cart',
            courier: {
              rateId: rate.rateId,
              kurirNama: rate.kurirNama,
              serviceNama: rate.serviceNama,
              estimasiHari: rate.estimasiHari,
            },
          },
          status: 'PENDING',
          payment_status: 'pending',
          items: {
            create: items.map((item) => ({
              product_id: item.product_id,
              circular_product_id: item.circular_product_id,
              quantity_kg: item.quantity_kg,
              price_per_kg: item.price_per_kg,
              subtotal: Math.round(item.subtotal),
            })),
          },
        }, items, userId + ':' + data.idempotency_key + ':' + supplierId);
      const order = reservation.order;
      if (!reservation.created) {
        if (order.payment_status !== 'pending' || !order.payment?.snap_token) throw new BadRequestException('Pesanan sedang disiapkan atau telah berakhir; periksa daftar pesanan');
        createdOrders.push({ orderId: order.id, orderNumber: order.order_number, snapToken: order.payment.snap_token, redirectUrl: '', supplierId, amount: order.total_amount + order.shipping_cost, shippingCost: order.shipping_cost });
        continue;
      }

      await this.shipmentService.createShipmentForCheckout({
        orderId: order.id,
        supplierId,
        rate,
        destination: {
          address: destination.address,
          postal_code: destination.postal_code,
          area_id: destination.area_id,
          contact_name: destination.contact_name || customerDetails.firstName,
          phone: destination.phone || customerDetails.phone,
        },
        weightKg: quote.weightKg,
      });

      const payment = await this.prisma.payment.create({
        data: {
          order_id: order.id,
          amount: rupiah(subtotal + orderShipping),
          gateway_order_id: order.id,
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
          name: `Ongkir ${rate.kurirNama} ${rate.serviceNama}`.trim(),
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
        shippingCost: orderShipping,
      });

      this.logger.log(
        `Checkout order created (awaiting payment): ${order.id} supplier=${supplierId} shipping=${orderShipping}`,
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
    if (!Number.isFinite(item.quantity_kg) || item.quantity_kg <= 0) throw new BadRequestException('Jumlah pesanan harus positif');
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
        supplier: { select: PUBLIC_USER_SELECT },
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
        buyer: { select: PUBLIC_USER_SELECT },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async updateOrderStatus(supplierId: string, orderId: string, status: string, note?: string, delivery_proof_url?: string) {
    return this.commerce.supplierTransition(supplierId, orderId, status, delivery_proof_url);
  }

  async updateOrderShipping(userId: string, orderId: string, data: unknown) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.buyer_id !== userId) throw new ForbiddenException('Not your order');
    throw new BadRequestException('Alamat dan biaya pesanan harus disepakati melalui tarif pengiriman server sebelum pembayaran');
  }

  async retryPayment(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { payment: true, shipment: true, items: { include: { product: true, circular_product: true } }, buyer: { include: { profile: true } } } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyer_id !== userId) throw new ForbiddenException('Not your order');
    if (order.payment_status !== 'pending' || order.stock_state !== 'RESERVED' || !order.reservation_expires_at || order.reservation_expires_at <= new Date() || !order.payment) throw new BadRequestException('Pembayaran tidak dapat diulang; periksa status atau buat pesanan baru');
    this.paymentService.assertConfigured();
    if (order.payment.snap_token) return { orderId: order.id, snapToken: order.payment.snap_token };
    if (!order.rfq_id || !order.shipment || order.shipment.status !== 'TERKONFIRMASI') throw new BadRequestException('Konfirmasikan tarif pengiriman server sebelum melanjutkan pembayaran RFQ');
    const amount = rupiah(order.total_amount + order.shipping_cost);
    await this.commerce.withOrder(orderId, async (tx, current) => {
      if (current.payment_status !== 'pending' || current.stock_state !== 'RESERVED' || !current.payment || current.payment.gateway_order_id) throw new BadRequestException('Pembayaran sedang disiapkan atau telah berakhir');
      const shipping = await tx.shipment.findUnique({ where: { order_id: orderId } });
      if (!shipping || Number(shipping.total_shipping_cost) !== current.shipping_cost || current.shipping_cost !== order.shipping_cost) throw new BadRequestException('Tarif pengiriman berubah; muat ulang pesanan');
      await tx.payment.update({ where: { id: current.payment.id }, data: { amount, gateway_order_id: order.id } });
    });
    const items = order.items.map(item => ({ id: item.product_id || item.circular_product_id, price: item.price_per_kg, quantity: item.quantity_kg, name: item.product?.batch_code || item.circular_product?.name || 'Produk pesanan' }));
    if (order.shipping_cost > 0) items.push({ id: 'shipping-fee', price: order.shipping_cost, quantity: 1, name: 'Pengiriman sesuai tarif server' });
    const result = await this.paymentService.createTransaction(order.id, amount, { firstName: order.buyer.profile?.contact_person || 'Buyer', email: order.buyer.email, phone: order.buyer.profile?.phone || undefined }, items);
    await this.prisma.payment.update({ where: { id: order.payment.id }, data: { snap_token: result.token } });
    return { orderId: order.id, snapToken: result.token, redirectUrl: result.redirect_url };
  }

  completeOrder(userId: string, orderId: string) { return this.commerce.complete(userId, orderId); }

  async resetOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.buyer_id !== userId && order.supplier_id !== userId) throw new ForbiddenException('Not your order');
    throw new BadRequestException('Pesanan tidak dapat diulang melalui reset. Silakan buat pesanan baru.');
  }
}
