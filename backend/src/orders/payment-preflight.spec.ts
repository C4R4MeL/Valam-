import { ServiceUnavailableException } from '@nestjs/common';
import { OrdersService } from './orders.service';

it('rejects invalid payment configuration before creating orders, shipments, payments or reserving stock', async () => {
  const prisma = { cartItem: { findMany: jest.fn() }, payment: { create: jest.fn() } };
  const payments = { assertConfigured: jest.fn(() => { throw new ServiceUnavailableException('Sandbox key required'); }), createTransaction: jest.fn() };
  const shipping = { quoteRatesForItems: jest.fn(), createShipmentForCheckout: jest.fn() };
  const commerce = { createReservedOrder: jest.fn() };
  const service = new OrdersService(prisma as any, payments as any, shipping as any, commerce as any);
  await expect(service.checkout('buyer-fixture', { idempotency_key: 'checkout-test-123' })).rejects.toThrow(ServiceUnavailableException);
  expect(prisma.cartItem.findMany).not.toHaveBeenCalled();
  expect(commerce.createReservedOrder).not.toHaveBeenCalled();
  expect(shipping.quoteRatesForItems).not.toHaveBeenCalled();
  expect(shipping.createShipmentForCheckout).not.toHaveBeenCalled();
  expect(prisma.payment.create).not.toHaveBeenCalled();
  expect(payments.createTransaction).not.toHaveBeenCalled();
});
