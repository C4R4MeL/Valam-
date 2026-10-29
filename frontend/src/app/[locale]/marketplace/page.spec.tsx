import { fireEvent, render, screen } from '@testing-library/react';
import MarketplacePage from './page';

jest.mock('next-intl', () => ({ useLocale: () => 'id' }));
jest.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }));
jest.mock('@/components/layout/Navbar', () => ({ Navbar: () => null }));
jest.mock('@/components/layout/Footer', () => ({ Footer: () => null }));
jest.mock('@/lib/valam-insights/insights-api', () => ({ getLatestMarketPrices: async () => [] }));
jest.mock('@/components/skeletons', () => ({ MarketplaceSkeleton: () => null, ProductGridSkeleton: () => null }));
jest.mock('@/components/marketplace/ProductCard', () => ({
  ProductCard: ({ product }: any) => <article>{product.batch_code}</article>,
}));
// Exercise the real page's filtering and reset with deterministic filter controls.
jest.mock('@/components/marketplace/FilterSidebar', () => ({
  FilterSidebar: ({ setFilters, onReset }: any) => <aside>
    <button onClick={() => setFilters((previous: any) => ({ ...previous, paMin: 30, paMax: 35 }))}>PA 30–35</button>
    <button onClick={() => setFilters((previous: any) => ({ ...previous, qualityTier: 'Commercial' }))}>Commercial filter</button>
    <button onClick={onReset}>Reset test filters</button>
  </aside>,
}));

const batch = (code: string, pa: number | null) => ({
  id: code, batch_code: code, supplier_name: 'Supplier fixture', origin_district: 'Aceh Barat',
  status: 'VERIFIED', pa_percentage: pa, lab_verified: false,
  available_volume_kg: 100, price_per_kg: 850000,
});

describe('Catalogue visibility with missing reviewed PA measurements', () => {
  const originalFetch = global.fetch;
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [
      batch('AWAITING-REVIEW', null), batch('MEASURED-25', 25),
      batch('MEASURED-32', 32), batch('MEASURED-ZERO', 0),
    ] }) });
  });
  afterEach(() => { global.fetch = originalFetch; });

  it('shows published batches with missing PA in the default catalogue without treating measured zero as missing', async () => {
    render(<MarketplacePage />);
    expect(await screen.findByText('AWAITING-REVIEW')).toBeInTheDocument();
    expect(screen.getByText('MEASURED-25')).toBeInTheDocument();
    expect(screen.getByText('MEASURED-32')).toBeInTheDocument();
    expect(screen.queryByText('MEASURED-ZERO')).not.toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });

  it('requires a measurement when narrowing PA and restores missing-PA batches after reset', async () => {
    render(<MarketplacePage />);
    await screen.findByText('AWAITING-REVIEW');
    fireEvent.click(screen.getByRole('button', { name: 'PA 30–35' }));
    expect(screen.queryByText('AWAITING-REVIEW')).not.toBeInTheDocument();
    expect(screen.queryByText('MEASURED-25')).not.toBeInTheDocument();
    expect(screen.getByText('MEASURED-32')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset test filters' }));
    expect(screen.getByText('AWAITING-REVIEW')).toBeInTheDocument();
    expect(screen.getByText('MEASURED-25')).toBeInTheDocument();
  });

  it('does not classify an absent PA result as Commercial grade', async () => {
    render(<MarketplacePage />);
    await screen.findByText('AWAITING-REVIEW');
    fireEvent.click(screen.getByRole('button', { name: 'Commercial filter' }));
    expect(screen.queryByText('AWAITING-REVIEW')).not.toBeInTheDocument();
    expect(screen.queryByText('MEASURED-32')).not.toBeInTheDocument();
    expect(screen.getByText('MEASURED-25')).toBeInTheDocument();
  });
});
