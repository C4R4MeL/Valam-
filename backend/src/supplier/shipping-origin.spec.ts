import { validate } from 'class-validator';
import { SupplierService } from './supplier.service';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

describe('Supplier shipping origin updates', () => {
  const profile = { id: 'supplier-profile', postal_code: '12345', area_id: 'old-area' };
  const prisma = { supplierProfile: { findUnique: jest.fn(), update: jest.fn() } };
  const service = new SupplierService(prisma as any, {} as any, {} as any);
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.supplierProfile.findUnique.mockResolvedValue(profile);
    prisma.supplierProfile.update.mockImplementation(async ({ data }) => ({ ...profile, ...data }));
  });

  it('saves the owner postcode and clears the previous resolved area when it changes', async () => {
    await service.updateProfile('owner-fixture', { postalCode: '23456' });
    expect(prisma.supplierProfile.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { user_id: 'owner-fixture' } }));
    expect(prisma.supplierProfile.update).toHaveBeenCalledWith({ where: { id: profile.id }, data: { postal_code: '23456', area_id: null } });
  });

  it('retains a resolved area when the postcode stays the same', async () => {
    await service.updateProfile('owner-fixture', { postalCode: '12345' });
    expect(prisma.supplierProfile.update).toHaveBeenCalledWith({ where: { id: profile.id }, data: { postal_code: '12345' } });
  });

  it('leaves shipping data alone when an unrelated profile field changes', async () => {
    await service.updateProfile('owner-fixture', { namaPic: 'Owner fixture' });
    expect(prisma.supplierProfile.update).toHaveBeenCalledWith({ where: { id: profile.id }, data: { nama_pic: 'Owner fixture' } });
  });

  it('accepts a five-digit postcode and an explicit clear but rejects invalid postcodes', async () => {
    for (const value of ['12345', null]) {
      const errors = await validate(Object.assign(new UpdateSupplierDto(), { postalCode: value }));
      expect(errors.filter(e => e.property === 'postalCode')).toHaveLength(0);
    }
    for (const value of ['1234', '123456', 'abcde', '']) {
      const errors = await validate(Object.assign(new UpdateSupplierDto(), { postalCode: value }));
      expect(errors.some(e => e.property === 'postalCode')).toBe(true);
    }
  });
});
