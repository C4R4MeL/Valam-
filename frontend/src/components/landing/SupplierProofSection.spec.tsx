import { render, screen } from '@testing-library/react';
import { SupplierProofSection } from './SupplierProofSection';

jest.mock('next-intl', () => ({ useLocale: () => 'id' }));

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

function suppliersResponse(data: unknown) {
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => data })) as jest.Mock;
}

it.each(['PETANI', 'PENYULING'])('renders a %s with a null cooperative name using its actual PIC name', async (supplier_subtype) => {
  suppliersResponse([{ id: 'supplier-1', nama_koperasi: null, nama_pic: 'Siti Aminah', supplier_subtype, kabupaten: 'Aceh Barat', grade_nilam: [], status: 'TERVERIFIKASI' }]);
  render(<SupplierProofSection />);
  expect(await screen.findByRole('heading', { name: 'Siti Aminah' })).toBeInTheDocument();
  expect(screen.getByText('SA')).toBeInTheDocument();
});

it('handles a legacy record with no available name without crashing or inventing an identity', async () => {
  suppliersResponse({ data: [{ id: 'legacy-1', nama_koperasi: null, nama_pic: null, kabupaten: 'Aceh Barat', grade_nilam: [], status: 'LEGACY_VERIFIED' }] });
  render(<SupplierProofSection />);
  expect(await screen.findByRole('heading', { name: 'Supplier' })).toBeInTheDocument();
});

it('preserves cooperative names and builds initials from words instead of empty spaces', async () => {
  suppliersResponse([{ id: 'cooperative-1', nama_koperasi: '  Koperasi   Nilam Jaya  ', supplier_subtype: 'KOPERASI', kabupaten: 'Aceh Jaya', grade_nilam: ['GRADE_A'], status: 'TERVERIFIKASI' }]);
  render(<SupplierProofSection />);
  expect(await screen.findByRole('heading', { name: 'Koperasi Nilam Jaya' })).toBeInTheDocument();
  expect(screen.getByText('KN')).toBeInTheDocument();
});
