import { ServiceUnavailableException } from '@nestjs/common';
import { MidtransGateway } from './midtrans.gateway';

const mockCreate = jest.fn();
const mockStatus = jest.fn();
jest.mock('midtrans-client', () => ({ Snap: jest.fn().mockImplementation(() => ({ createTransaction: mockCreate, transaction: { status: mockStatus } })) }));

describe('Midtrans environment configuration before any gateway call', () => {
  const original = { ...process.env };
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MIDTRANS_IS_PRODUCTION = 'false';
    process.env.MIDTRANS_SERVER_KEY = 'SB-Mid-server-unit-fixture';
    mockCreate.mockResolvedValue({ token: 'unit-token' });
  });
  afterAll(() => { process.env = original; });

  it('rejects a missing key before sending a transaction', () => {
    delete process.env.MIDTRANS_SERVER_KEY;
    expect(() => new MidtransGateway().createTransaction({})).toThrow(ServiceUnavailableException);
    expect(mockCreate).not.toHaveBeenCalled();
  });
  it('allows a non-SB key in sandbox and selects the sandbox SDK endpoint', async () => {
    process.env.MIDTRANS_SERVER_KEY = 'Mid-server-unit-fixture';
    const gateway = new MidtransGateway();
    await expect(gateway.createTransaction({})).resolves.toEqual({ token: 'unit-token' });
    expect(require('midtrans-client').Snap).toHaveBeenCalledWith(expect.objectContaining({ isProduction: false }));
    await gateway.status('unit-order');
    expect(mockStatus).toHaveBeenCalledWith('unit-order');
  });
  it('rejects an invalid environment flag before sending a transaction', () => {
    process.env.MIDTRANS_IS_PRODUCTION = 'invalid';
    expect(() => new MidtransGateway().assertConfigured()).toThrow(ServiceUnavailableException);
    expect(mockCreate).not.toHaveBeenCalled();
  });
  it('blocks production payments under automated tests even with a production-shaped key', () => {
    process.env.MIDTRANS_IS_PRODUCTION = 'true';
    process.env.NODE_ENV = 'test';
    process.env.MIDTRANS_SERVER_KEY = 'Mid-server-unit-fixture';
    expect(() => new MidtransGateway().createTransaction({})).toThrow(/lingkungan pengujian/);
    expect(mockCreate).not.toHaveBeenCalled();
  });
  it('delegates a configured sandbox transaction to the SDK transport', async () => {
    const payload = { transaction_details: { order_id: 'unit-order', gross_amount: 1000 } };
    await expect(new MidtransGateway().createTransaction(payload)).resolves.toEqual({ token: 'unit-token' });
    expect(mockCreate).toHaveBeenCalledWith(payload);
  });
});
