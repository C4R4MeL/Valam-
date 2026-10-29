import { Test } from '@nestjs/testing';
import { stopTestTimers } from './test-timers';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { CommerceService } from '../src/commerce/commerce.service';
import { OrdersService } from '../src/orders/orders.service';
import { ShipmentService } from '../src/shipment/shipment.service';
import { WalletService } from '../src/wallet/wallet.service';
import { PaymentService } from '../src/payment/payment.service';
import { MidtransGateway } from '../src/payment/midtrans.gateway';
import { BiteshipService } from '../src/shipment/biteship.service';
import { ProductsService } from '../src/products/products.service';
import { RfqService } from '../src/rfq/rfq.service';
const { assertTestEnvironment } = require('../scripts/pertamuda-env.cjs');

// Each regression performs multiple real remote PostgreSQL transactions. This is
// the whole scenario budget, not the application's transaction timeout or SLA.
jest.setTimeout(90000);

describe('Commerce business regressions with PostgreSQL and simulated gateway transport', () => {
  let app: INestApplication, prisma: PrismaService, commerce: CommerceService;
  let payments: PaymentService,
    orders: OrdersService,
    shipment: ShipmentService,
    wallets: WalletService;
  let buyerId: string, supplierId: string, batchId: string, buyerToken: string;
  let previousKey: string | undefined;
  const secret = 'SB-Mid-server-pertamuda-regression-only';
  const statuses = new Map<string, Record<string, unknown>>();
  const gateway = {
    createTransaction: jest.fn(async () => ({
      token: 'simulated-snap-token',
      redirect_url: 'https://example.test/sandbox',
    })),
    status: jest.fn(async (id: string) => statuses.get(id)),
  };

  beforeAll(async () => {
    assertTestEnvironment(process.env);
    previousKey = process.env.MIDTRANS_SERVER_KEY;
    process.env.MIDTRANS_SERVER_KEY = secret;
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MidtransGateway)
      .useValue(gateway)
      .overrideProvider(BiteshipService)
      .useValue({
        getRates: jest.fn(async () => [
          {
            rateId: 'demo-rate',
            kurirKode: 'demo',
            kurirNama: 'DEMONSTRASI',
            serviceKode: 'demo',
            serviceNama: 'SIMULASI',
            ongkirDasar: 10000,
            estimasiHari: 2,
          },
        ]),
        createOrder: jest.fn(async () => ({
          id: 'simulated-shipping',
          courier: { waybill_id: 'DEMO-AWB' },
        })),
        verifyWebhook: () => false,
      })
      .compile();
    app = module.createNestApplication({ logger: false });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    stopTestTimers(app);
    prisma = app.get(PrismaService);
    commerce = app.get(CommerceService);
    payments = app.get(PaymentService);
    orders = app.get(OrdersService);
    shipment = app.get(ShipmentService);
    wallets = app.get(WalletService);
    const accounts = JSON.parse(
      readFileSync('.pertamuda-credentials.json', 'utf8'),
    );
    buyerId = (
      await prisma.user.findUniqueOrThrow({
        where: { email: accounts.buyer.email },
      })
    ).id;
    supplierId = (
      await prisma.user.findUniqueOrThrow({
        where: { email: accounts.supplier.email },
      })
    ).id;
    // Fixture is explicitly unverified, with non-real identity/contact/bank data.
    await prisma.supplierProfile.upsert({
      where: { user_id: supplierId },
      update: {},
      create: {
        user_id: supplierId,
        nama_pic: 'DEMONSTRASI',
        ktp_pic: 'DEMO-NOT-A-REAL-ID',
        whatsapp: '',
        kabupaten: 'Aceh Barat',
        kecamatan: 'DEMONSTRASI',
        desa: 'DEMONSTRASI',
        postal_code: '23615',
        nomor_rekening: 'DEMO-NOT-A-BANK-ACCOUNT',
        nama_bank: 'SIMULASI',
        nama_rekening: 'DEMONSTRASI',
      },
    });
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send(accounts.buyer)
      .expect(200);
    buyerToken = login.body.access_token;
  }, 60000);

  beforeEach(async () => {
    statuses.clear();
    gateway.status.mockClear();
    batchId = (
      await prisma.product.create({
        data: {
          batch_code: 'DEMO-COMMERCE-' + randomUUID(),
          supplier_id: supplierId,
          status: 'VERIFIED',
          is_demo: true,
          price_type: 'DEMONSTRATION',
          total_volume_kg: 100,
          available_volume_kg: 100,
          moq_kg: 10,
          price_per_kg: 100,
        },
      })
    ).id;
    await prisma.wallet.upsert({
      where: { user_id: supplierId },
      update: { balance: 0, refund_due: 0, frozen: false },
      create: { user_id: supplierId },
    });
  });

  afterEach(async () => {
    const rows = await prisma.order.findMany({
      where: { items: { some: { product_id: batchId } } },
      select: { id: true },
    });
    await prisma.walletTransaction.deleteMany({
      where: { reference_order_id: { in: rows.map((o) => o.id) } },
    });
    await prisma.order.deleteMany({
      where: { id: { in: rows.map((o) => o.id) } },
    });
    await prisma.rfqRequest.deleteMany({
      where: { rfq_number: { startsWith: 'RFQ-TEST-' } },
    });
    await prisma.product.delete({ where: { id: batchId } });
    const wallet = await prisma.wallet.findUniqueOrThrow({
      where: { user_id: supplierId },
    });
    await prisma.withdrawal.deleteMany({ where: { wallet_id: wallet.id } });
    await prisma.walletTransaction.deleteMany({
      where: { wallet_id: wallet.id },
    });
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: 0, refund_due: 0, frozen: false },
    });
  });

  afterAll(async () => {
    if (previousKey === undefined) delete process.env.MIDTRANS_SERVER_KEY;
    else process.env.MIDTRANS_SERVER_KEY = previousKey;
    if (prisma)
      await prisma.supplierProfile.deleteMany({
        where: { user_id: supplierId, ktp_pic: 'DEMO-NOT-A-REAL-ID' },
      });
    if (app) await app.close();
  });

  const line = (quantity = 60) => ({
    product_id: batchId,
    circular_product_id: null,
    quantity_kg: quantity,
    price_per_kg: 100,
  });
  async function reserve(key = randomUUID(), quantity = 60) {
    return commerce.createReservedOrder(
      {
        order_number: 'DEMO-ORD-' + randomUUID(),
        buyer_id: buyerId,
        supplier_id: supplierId,
        total_amount: quantity * 100,
        items: { create: { ...line(quantity), subtotal: quantity * 100 } },
      },
      [line(quantity)],
      key,
    );
  }
  async function payment(orderId: string) {
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
    });
    await prisma.payment.create({
      data: {
        order_id: orderId,
        amount: order.total_amount,
        gateway_order_id: orderId,
      },
    });
    statuses.set(orderId, {
      order_id: orderId,
      gross_amount: order.total_amount.toFixed(2),
      transaction_status: 'settlement',
      currency: 'IDR',
      transaction_id: 'DEMO-TRANSACTION',
    });
    return notification(orderId, order.total_amount);
  }
  function notification(orderId: string, amount: number) {
    const gross_amount = amount.toFixed(2),
      status_code = '200';
    return {
      order_id: orderId,
      gross_amount,
      status_code,
      signature_key: createHash('sha512')
        .update(orderId + status_code + gross_amount + secret)
        .digest('hex'),
    };
  }
  async function stock() {
    return (await prisma.product.findUniqueOrThrow({ where: { id: batchId } }))
      .available_volume_kg;
  }

  it('reserves stock atomically under competing checkouts and rejects negative quantity', async () => {
    const result = await Promise.allSettled([reserve(), reserve()]);
    expect(result.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(await stock()).toBe(40);
    await expect(reserve(randomUUID(), -1)).rejects.toThrow();
    expect(await stock()).toBe(40);
  });

  it('one checkout key creates one order and one stock reservation even concurrently', async () => {
    const key = randomUUID();
    const rows = await Promise.all([reserve(key), reserve(key)]);
    expect(rows[0].order.id).toBe(rows[1].order.id);
    expect(await prisma.order.count({ where: { checkout_key: key } })).toBe(1);
    expect(await stock()).toBe(40);
  });

  it('HTTP checkout uses server prices and supports replay without a second order', async () => {
    const body = {
      direct: true,
      product_id: batchId,
      quantity_kg: 60,
      price_per_kg: 1,
      destinationAddress: {
        address: 'Alamat DEMONSTRASI',
        postal_code: '23615',
        contact_name: 'DEMO',
        phone: '',
      },
      selectedRates: { [supplierId]: 'demo-rate' },
      idempotency_key: randomUUID(),
    };
    const first = await request(app.getHttpServer())
      .post('/api/orders/checkout')
      .auth(buyerToken, { type: 'bearer' })
      .send(body)
      .expect(201);
    const second = await request(app.getHttpServer())
      .post('/api/orders/checkout')
      .auth(buyerToken, { type: 'bearer' })
      .send(body)
      .expect(201);
    expect(first.body.orderId).toBe(second.body.orderId);
    expect(
      (
        await prisma.order.findUniqueOrThrow({
          where: { id: first.body.orderId },
        })
      ).total_amount,
    ).toBe(6000);
    expect(await stock()).toBe(40);
  });

  it('rejects missing/invalid signature, unknown reference and amount mismatch before mutation', async () => {
    const order = (await reserve()).order;
    const input = await payment(order.id);
    await request(app.getHttpServer())
      .post('/api/payment/notification')
      .send({ ...input, signature_key: '' })
      .expect(401);
    expect(gateway.status).not.toHaveBeenCalled();
    await expect(
      payments.handleNotification(notification(randomUUID(), 6000)),
    ).rejects.toThrow('Unknown payment');
    statuses.set(order.id, { ...statuses.get(order.id), gross_amount: '1.00' });
    await expect(payments.handleNotification(input)).rejects.toThrow(
      'amount mismatch',
    );
    expect(
      (
        await prisma.payment.findUniqueOrThrow({
          where: { order_id: order.id },
        })
      ).status,
    ).toBe('pending');
    expect(await stock()).toBe(40);
  });

  it('concurrent settlement callbacks consume reservation once; later pending cannot downgrade paid', async () => {
    const order = (await reserve()).order,
      input = await payment(order.id);
    await Promise.all([
      payments.handleNotification(input),
      payments.handleNotification(input),
    ]);
    expect(await stock()).toBe(40);
    statuses.set(order.id, {
      ...statuses.get(order.id),
      transaction_status: 'pending',
    });
    await payments.handleNotification(input);
    expect(
      await prisma.order.findUniqueOrThrow({ where: { id: order.id } }),
    ).toMatchObject({ payment_status: 'paid', stock_state: 'CONSUMED' });
  });

  it('supplier proof cannot complete/release funds; buyer must receive a paid shipped order', async () => {
    const order = (await reserve()).order;
    await expect(
      orders.updateOrderStatus(
        supplierId,
        order.id,
        'COMPLETED',
        '',
        '/uploads/proof.jpg',
      ),
    ).rejects.toThrow();
    await expect(orders.completeOrder(buyerId, order.id)).rejects.toThrow();
    await payments.handleNotification(await payment(order.id));
    await orders.updateOrderStatus(supplierId, order.id, 'PACKED');
    await orders.updateOrderStatus(supplierId, order.id, 'SHIPPED');
    const shipping = await prisma.shipment.create({
      data: {
        order_id: order.id,
        status: 'DIKIRIM',
        origin_address: {},
        destination_address: {},
      },
    });
    await Promise.all([
      orders.completeOrder(buyerId, order.id),
      shipment.confirmReceived(shipping.id, buyerId),
      orders.completeOrder(buyerId, order.id),
    ]);
    expect(
      Number(
        (
          await prisma.wallet.findUniqueOrThrow({
            where: { user_id: supplierId },
          })
        ).balance,
      ),
    ).toBe(6000);
    expect(
      await prisma.walletTransaction.count({
        where: { reference_order_id: order.id, type: 'CREDIT' },
      }),
    ).toBe(1);
  });

  it('expiry/failure release stock exactly once, and late settlement is held for review', async () => {
    const order = (await reserve()).order,
      input = await payment(order.id);
    await prisma.order.update({
      where: { id: order.id },
      data: { reservation_expires_at: new Date(0) },
    });
    await Promise.all([
      commerce.expireReservations(),
      commerce.expireReservations(),
    ]);
    expect(await stock()).toBe(100);
    await payments.handleNotification(input);
    expect(
      (await prisma.order.findUniqueOrThrow({ where: { id: order.id } }))
        .status,
    ).toBe('PAYMENT_REVIEW');
    expect(await stock()).toBe(100);
    expect(
      Number(
        (
          await prisma.wallet.findUniqueOrThrow({
            where: { user_id: supplierId },
          })
        ).balance,
      ),
    ).toBe(0);
  });

  it('paid cancellation requests a refund; only gateway-confirmed full refund restores unsent stock', async () => {
    const order = (await reserve()).order,
      input = await payment(order.id);
    await payments.handleNotification(input);
    await orders.updateOrderStatus(supplierId, order.id, 'CANCELLED');
    expect(
      (await prisma.order.findUniqueOrThrow({ where: { id: order.id } }))
        .status,
    ).toBe('REFUND_REQUESTED');
    expect(await stock()).toBe(40);
    // Changing the notification body is insufficient: authoritative gateway still says paid.
    await payments.handleNotification({
      ...input,
      transaction_status: 'refund',
    });
    expect(await stock()).toBe(40);
    statuses.set(order.id, {
      ...statuses.get(order.id),
      transaction_status: 'refund',
    });
    await Promise.all([
      payments.handleNotification(input),
      payments.handleNotification(input),
    ]);
    expect(await stock()).toBe(100);
    expect(
      (
        await prisma.payment.findUniqueOrThrow({
          where: { order_id: order.id },
        })
      ).status,
    ).toBe('refunded');
  });

  it('withdrawals reject negative amounts, cannot overdraw concurrently, and replay does not debit twice', async () => {
    await prisma.wallet.update({
      where: { user_id: supplierId },
      data: { balance: 100 },
    });
    await expect(
      wallets.requestWithdrawal(supplierId, -1, '', randomUUID()),
    ).rejects.toThrow();
    const keys = [randomUUID(), randomUUID()];
    const results = await Promise.allSettled(
      keys.map((key) => wallets.requestWithdrawal(supplierId, 80, '', key)),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const successIndex = results.findIndex((r) => r.status === 'fulfilled');
    await wallets.requestWithdrawal(supplierId, 80, '', keys[successIndex]);
    const wallet = await prisma.wallet.findUniqueOrThrow({
      where: { user_id: supplierId },
    });
    expect(Number(wallet.balance)).toBe(20);
    expect(
      await prisma.withdrawal.count({ where: { wallet_id: wallet.id } }),
    ).toBe(1);
  });

  it('confirmed refund after credit reverses available balance once and records shortfall without negative wallet', async () => {
    const order = (await reserve()).order,
      input = await payment(order.id);
    await payments.handleNotification(input);
    await orders.updateOrderStatus(supplierId, order.id, 'PACKED');
    await orders.updateOrderStatus(supplierId, order.id, 'SHIPPED');
    await orders.completeOrder(buyerId, order.id);
    await wallets.requestWithdrawal(supplierId, 5000, '', randomUUID());
    statuses.set(order.id, {
      ...statuses.get(order.id),
      transaction_status: 'refund',
    });
    await Promise.all([
      payments.handleNotification(input),
      payments.handleNotification(input),
    ]);
    const wallet = await prisma.wallet.findUniqueOrThrow({
      where: { user_id: supplierId },
    });
    expect(Number(wallet.balance)).toBe(0);
    expect(Number(wallet.refund_due)).toBe(5000);
    expect(wallet.frozen).toBe(true);
    expect(
      await prisma.walletTransaction.count({
        where: { reference_order_id: order.id, type: 'REFUND_DEBIT' },
      }),
    ).toBe(1);
    // Physical stock is not restored after a shipment without evidence of a return.
    expect(await stock()).toBe(40);
    await expect(
      wallets.requestWithdrawal(supplierId, 1, '', randomUUID()),
    ).rejects.toThrow();
  });

  it('failed gateway confirmation releases reservations once and transaction reset cannot erase financial state', async () => {
    const order = (await reserve()).order,
      input = await payment(order.id);
    statuses.set(order.id, {
      ...statuses.get(order.id),
      transaction_status: 'deny',
    });
    await Promise.all([
      payments.handleNotification(input),
      payments.handleNotification(input),
    ]);
    expect(await stock()).toBe(100);
    await expect(orders.resetOrder(buyerId, order.id)).rejects.toThrow();
    expect(
      (await prisma.order.findUniqueOrThrow({ where: { id: order.id } }))
        .payment_status,
    ).toBe('failed');
  });

  it('supplier inventory edits cannot overwrite reserved stock or delete evidence of an order', async () => {
    await reserve();
    const products = app.get(ProductsService);
    await expect(
      products.updateProduct(batchId, supplierId, { total_volume_kg: 999 }),
    ).rejects.toThrow();
    await expect(products.deleteProduct(batchId, supplierId)).rejects.toThrow();
    expect(await stock()).toBe(40);
    expect(
      await prisma.orderItem.count({ where: { product_id: batchId } }),
    ).toBe(1);
  });

  it('shipping callbacks are monotonic/idempotent and delivery alone never credits the wallet', async () => {
    const order = (await reserve()).order,
      input = await payment(order.id);
    await payments.handleNotification(input);
    await orders.updateOrderStatus(supplierId, order.id, 'PACKED');
    await orders.updateOrderStatus(supplierId, order.id, 'SHIPPED');
    const shipping = await prisma.shipment.create({
      data: {
        order_id: order.id,
        status: 'DIKIRIM',
        tracking_number: 'DEMO-' + randomUUID(),
        origin_address: {},
        destination_address: {},
      },
    });
    const event = {
      courier: { waybill_id: shipping.tracking_number },
      status: 'delivered',
    };
    await Promise.all([
      shipment.handleBiteshipWebhook(event),
      shipment.handleBiteshipWebhook(event),
    ]);
    await shipment.handleBiteshipWebhook({ ...event, status: 'in_transit' });
    expect(
      (await prisma.shipment.findUniqueOrThrow({ where: { id: shipping.id } }))
        .status,
    ).toBe('TIBA_DI_TUJUAN');
    expect(
      await prisma.shipmentTrackingLog.count({
        where: { shipment_id: shipping.id, status: 'TIBA_DI_TUJUAN' },
      }),
    ).toBe(1);
    expect(
      Number(
        (
          await prisma.wallet.findUniqueOrThrow({
            where: { user_id: supplierId },
          })
        ).balance,
      ),
    ).toBe(0);
    await shipment.confirmReceived(shipping.id, buyerId);
    await shipment.handleBiteshipWebhook(event);
    expect(
      (await prisma.shipment.findUniqueOrThrow({ where: { id: shipping.id } }))
        .status,
    ).toBe('SELESAI');
  });

  async function rfq() {
    return prisma.rfqRequest.create({
      data: {
        rfq_number: 'RFQ-TEST-' + randomUUID(),
        buyer_id: buyerId,
        supplier_id: supplierId,
        volume_kg: 60,
        budget_per_kg: 100,
        min_pa_percentage: 30,
        max_moisture: 3,
      },
    });
  }
  const offer = () => ({
    product_id: batchId,
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    proposed_price_per_kg: 75,
    proposed_volume_kg: 60,
    action: 'COUNTER' as const,
  });

  it('RFQ acceptance uses the explicit counter-offer batch/price, reserves once under concurrency, and continues payment at that price', async () => {
    const service = app.get(RfqService),
      inquiry = await rfq();
    await service.respondToRfq(supplierId, inquiry.id, offer());
    const [first, second] = await Promise.all([
      service.closeRfq(buyerId, inquiry.id, 'ACCEPTED'),
      service.closeRfq(buyerId, inquiry.id, 'ACCEPTED'),
    ]);
    expect(first.order!.id).toBe(second.order!.id);
    const order = await prisma.order.findUniqueOrThrow({
      where: { rfq_id: inquiry.id },
      include: { items: true, payment: true },
    });
    expect(order.items[0]).toMatchObject({
      product_id: batchId,
      quantity_kg: 60,
      price_per_kg: 75,
      subtotal: 4500,
    });
    expect(order.total_amount).toBe(4500);
    expect(await stock()).toBe(40);
    await prisma.profile.update({
      where: { user_id: buyerId },
      data: { postal_code: '23615' },
    });
    try {
      await shipment.confirmOngkir(order.id, 'demo-rate', buyerId);
      expect(app.get(BiteshipService).getRates).toHaveBeenLastCalledWith(
        expect.objectContaining({ itemValue: 4500 }),
      );
      const result = await orders.retryPayment(buyerId, order.id);
      expect(result.snapToken).toBe('simulated-snap-token');
      const updated = await prisma.order.findUniqueOrThrow({
        where: { id: order.id },
        include: { payment: true, items: true },
      });
      expect(updated.items[0].price_per_kg).toBe(75);
      expect(updated.items[0].product_id).toBe(batchId);
      expect(updated.payment!.amount).toBe(4500 + updated.shipping_cost);
      expect(gateway.createTransaction).toHaveBeenLastCalledWith(
        expect.objectContaining({
          transaction_details: {
            order_id: order.id,
            gross_amount: updated.payment!.amount,
          },
        }),
      );
    } finally {
      await prisma.profile.update({
        where: { user_id: buyerId },
        data: { postal_code: null },
      });
    }
  }, 90000);

  it('RFQ rejects expired/incomplete/foreign offers and does not choose another batch', async () => {
    const service = app.get(RfqService),
      inquiry = await rfq();
    await expect(
      service.respondToRfq(supplierId, inquiry.id, {
        ...offer(),
        product_id: undefined,
      }),
    ).rejects.toThrow();
    await expect(
      service.respondToRfq(buyerId, inquiry.id, offer()),
    ).rejects.toThrow();
    await service.respondToRfq(supplierId, inquiry.id, offer());
    await prisma.rfqResponse.update({
      where: { rfq_id: inquiry.id },
      data: { expires_at: new Date(0) },
    });
    await expect(
      service.closeRfq(buyerId, inquiry.id, 'ACCEPTED'),
    ).rejects.toThrow();
    expect(await prisma.order.count({ where: { rfq_id: inquiry.id } })).toBe(0);
    expect(await stock()).toBe(100);
  });

  it('RFQ stock exhaustion rolls back acceptance, rejection creates no order, and buyer cannot inject a price', async () => {
    const service = app.get(RfqService),
      inquiry = await rfq();
    await service.respondToRfq(supplierId, inquiry.id, offer());
    await prisma.product.update({
      where: { id: batchId },
      data: { available_volume_kg: 10 },
    });
    await expect(
      service.closeRfq(buyerId, inquiry.id, 'ACCEPTED'),
    ).rejects.toThrow();
    expect(
      (await prisma.rfqRequest.findUniqueOrThrow({ where: { id: inquiry.id } }))
        .status,
    ).toBe('COUNTER_OFFER');
    expect(await prisma.order.count({ where: { rfq_id: inquiry.id } })).toBe(0);
    await request(app.getHttpServer())
      .put('/api/rfq/' + inquiry.id + '/close')
      .auth(buyerToken, { type: 'bearer' })
      .send({ status: 'ACCEPTED', proposed_price_per_kg: 1 })
      .expect(400);
    await service.closeRfq(buyerId, inquiry.id, 'REJECTED');
    await expect(
      service.closeRfq(buyerId, inquiry.id, 'ACCEPTED'),
    ).rejects.toThrow();
    expect(await stock()).toBe(10);
  });
});
