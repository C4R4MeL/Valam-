import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MarketPricesService } from './market-prices.service';

describe('MarketPricesService', () => {
  const prisma = { $queryRaw: jest.fn() };
  const service = new MarketPricesService(prisma as any);
  beforeEach(() => jest.resetAllMocks());

  it('returns the persisted row including database timestamp', async () => {
    const row = { id: 'price-id', grade: 'A', price_per_kg: 923456, updated_at: new Date() };
    prisma.$queryRaw.mockResolvedValue([row]);
    expect(await service.update('price-id', 923456, 'admin-id')).toBe(row);
    // Values remain query parameters rather than being interpolated into SQL.
    expect(prisma.$queryRaw.mock.calls[0].slice(1)).toEqual([923456, 'admin-id', 'price-id']);
  });

  it('does not report success for an unknown price record', async () => {
    prisma.$queryRaw.mockResolvedValue([]);
    await expect(service.update('missing', 923456, 'admin')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('propagates database failures rather than returning an invented price', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('database unavailable'));
    await expect(service.findAll()).rejects.toThrow('database unavailable');
    await expect(service.update('id', 923456, 'admin')).rejects.toThrow('database unavailable');
  });

  it('rejects unsupported history grades', () => {
    expect(() => service.history('D', 10)).toThrow(BadRequestException);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });
});
