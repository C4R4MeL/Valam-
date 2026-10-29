import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { MidtransGateway } from './midtrans.gateway';
import { BadGatewayException, ServiceUnavailableException } from '@nestjs/common';

describe('PaymentService', () => {
  let service: PaymentService;
  const gateway = { assertConfigured: jest.fn(), createTransaction: jest.fn(), status: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentService],
    }).useMocker(token => token === MidtransGateway ? gateway : ({})).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const create = () => service.createTransaction('unit-order', 1000, { email: 'buyer@example.test' }, [{ id: 'item', price: 1000, quantity: 1, name: 'Unit item' }]);
  it('preserves configuration failures as HTTP 503 without attempting payment', async () => {
    gateway.assertConfigured.mockImplementation(() => { throw new ServiceUnavailableException('Sandbox key required'); });
    await expect(create()).rejects.toThrow(ServiceUnavailableException);
    expect(gateway.createTransaction).not.toHaveBeenCalled();
  });
  it('reports rejected credentials without leaking the provider response', async () => {
    gateway.createTransaction.mockRejectedValue({ httpStatusCode: 401, message: 'private provider details' });
    await expect(create()).rejects.toThrow(/Midtrans menolak akses/);
    await expect(create()).rejects.not.toThrow('private provider details');
  });
  it('returns a gateway error for transport failure instead of generic HTTP 500', async () => {
    gateway.createTransaction.mockRejectedValue(new Error('network failure'));
    await expect(create()).rejects.toThrow(BadGatewayException);
  });
  it('rejects a successful HTTP response without a usable Snap token', async () => {
    gateway.createTransaction.mockResolvedValue({ redirect_url: 'https://example.test/checkout' });
    await expect(create()).rejects.toThrow(/token pembayaran/);
  });
  it('returns the token and redirect from a configured gateway', async () => {
    gateway.createTransaction.mockResolvedValue({ token: 'unit-token', redirect_url: 'https://example.test/checkout' });
    await expect(create()).resolves.toEqual({ token: 'unit-token', redirect_url: 'https://example.test/checkout' });
  });
});
