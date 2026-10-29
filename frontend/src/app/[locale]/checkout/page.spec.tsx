import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import CheckoutPage from './page';

const mockRouter = { push: jest.fn(), back: jest.fn() };
const mockToast = jest.fn();
const mockQuote = jest.fn();
const mockCart = {
  patchouliItems: [{ id: 'cart-fixture', product_id: 'product-fixture', quantity_kg: 1,
    product: { supplier_id: 'supplier-fixture', supplier_name: 'Supplier fixture', price_per_kg: 960000 } }],
  circularItems: [], loading: false, removeItem: jest.fn(), clearCart: jest.fn(), fetchCart: jest.fn(),
};
jest.mock('@/i18n/routing', () => ({
  useRouter: () => mockRouter,
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}));
jest.mock('next-intl', () => ({ useLocale: () => 'en' }));
jest.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }));
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mockToast }) }));
jest.mock('@/components/providers/CartProvider', () => ({ useCart: () => mockCart }));
jest.mock('@/components/skeletons', () => ({ CheckoutSkeleton: () => null }));
// Use native address selects while exercising the real checkout state and fetches.
jest.mock('@/components/ui/select', () => {
  const React = require('react');
  const SelectTrigger = () => null;
  const SelectContent = ({ children }: any) => <>{children}</>;
  return {
    SelectTrigger, SelectContent, SelectValue: () => null,
    SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
    Select: ({ children, value, onValueChange, disabled }: any) => {
      const nodes: any[] = React.Children.toArray(children);
      const placeholder = nodes.find(n => n.type === SelectTrigger)?.props.children.props.placeholder;
      return <select aria-label={placeholder} value={value} disabled={disabled} onChange={e => onValueChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {nodes.find(n => n.type === SelectContent)?.props.children}
      </select>;
    },
  };
});

const response = (data: any, ok = true) => ({ ok, status: ok ? 200 : 502, json: async () => data });
const rates = (area: string, empty = false) => response({ groups: [{ supplierId: 'supplier-fixture', rates: empty ? [] : [{
  rateId: area, kurirNama: `Courier ${area}`, serviceNama: 'Cargo', totalOngkir: 80000,
  ongkirDasar: 28080, biayaAsuransi: 1920, biayaPengemasan: 50000, estimasiHari: 3,
}] }] });

async function selectDestination(district = 'district-a') {
  await screen.findByRole('option', { name: 'Province fixture' });
  fireEvent.change(screen.getByRole('combobox', { name: 'Select Province' }), { target: { value: 'province' } });
  await screen.findByRole('option', { name: 'City fixture' });
  fireEvent.change(screen.getByRole('combobox', { name: 'Select City' }), { target: { value: 'city' } });
  await screen.findByRole('option', { name: 'District A' });
  fireEvent.change(screen.getByRole('combobox', { name: 'Select District' }), { target: { value: district } });
}

describe('Checkout courier quote loading', () => {
  const originalFetch = global.fetch;
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('valam_token', 'checkout-test-token');
    mockQuote.mockImplementation(async (body: any) => rates(body.destinationAreaId));
    global.fetch = jest.fn(async (url: any, options?: any) => {
      const path = String(url);
      if (path.endsWith('/provinces.json')) return response([{ id: 'province', name: 'Province fixture' }]);
      if (path.includes('/regencies/')) return response([{ id: 'city', name: 'City fixture' }]);
      if (path.includes('/districts/')) return response([{ id: 'district-a', name: 'District A' }, { id: 'district-b', name: 'District B' }]);
      if (path.includes('/areas/search')) return response([{ id: decodeURIComponent(path).includes('District B') ? 'area-b' : 'area-a', postal_code: 12345 }]);
      if (path.endsWith('/shipment/quote')) return mockQuote(JSON.parse(options.body));
      throw Error(`Unexpected request: ${path}`);
    }) as any;
  });
  afterEach(() => { global.fetch = originalFetch; localStorage.clear(); });

  it('automatically requests and displays rates after district selection', async () => {
    render(<CheckoutPage />);
    expect(screen.queryByText('No courier services for this route.')).not.toBeInTheDocument();
    expect(mockQuote).not.toHaveBeenCalled();
    await selectDestination();
    expect(await screen.findByText('Courier area-a — Cargo')).toBeInTheDocument();
    expect(mockQuote).toHaveBeenCalledTimes(1);
    expect(mockQuote).toHaveBeenCalledWith(expect.objectContaining({ destinationAreaId: 'area-a', destinationPostalCode: '12345',
      groups: [{ supplierId: 'supplier-fixture', items: [{ productId: 'product-fixture', quantityKg: 1 }] }] }));
  });

  it('shows no services only after a successful quote actually returns no rates', async () => {
    let finish!: (result: any) => void;
    mockQuote.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    render(<CheckoutPage />);
    await selectDestination();
    await waitFor(() => expect(mockQuote).toHaveBeenCalledTimes(1));
    expect(screen.getByText('Calculating Biteship rates...')).toBeInTheDocument();
    expect(screen.queryByText('No courier services for this route.')).not.toBeInTheDocument();
    await act(async () => { finish(rates('area-a', true)); });
    expect(await screen.findByText('No courier services for this route.')).toBeInTheDocument();
  });

  it('shows API failures and allows a retry instead of claiming the route has no courier', async () => {
    mockQuote.mockResolvedValueOnce(response({ message: 'Shipping provider unavailable' }, false));
    render(<CheckoutPage />);
    await selectDestination();
    expect(await screen.findByText('Shipping provider unavailable')).toBeInTheDocument();
    expect(screen.queryByText('No courier services for this route.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Courier area-a — Cargo')).toBeInTheDocument();
    expect(mockQuote).toHaveBeenCalledTimes(2);
  });

  it('ignores a delayed response for the previous destination', async () => {
    let finishOld!: (result: any) => void;
    mockQuote.mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve; }));
    render(<CheckoutPage />);
    await selectDestination();
    await waitFor(() => expect(mockQuote).toHaveBeenCalledTimes(1));
    fireEvent.change(screen.getByRole('combobox', { name: 'Select District' }), { target: { value: 'district-b' } });
    expect(await screen.findByText('Courier area-b — Cargo')).toBeInTheDocument();
    await act(async () => { finishOld(rates('area-a')); });
    expect(screen.queryByText('Courier area-a — Cargo')).not.toBeInTheDocument();
    expect(screen.getByText('Courier area-b — Cargo')).toBeInTheDocument();
  });

  it('treats missing supplier quote groups as an invalid response, not as an unserved route', async () => {
    mockQuote.mockResolvedValueOnce(response({ groups: [] }));
    render(<CheckoutPage />);
    await selectDestination();
    expect(await screen.findByText('Incomplete shipping quote response. Please try again.')).toBeInTheDocument();
    expect(screen.queryByText('No courier services for this route.')).not.toBeInTheDocument();
  });
});
