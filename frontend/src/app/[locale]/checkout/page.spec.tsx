import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import CheckoutPage from './page';

const mockRouter = { push: jest.fn(), back: jest.fn() };
const mockToast = jest.fn();
const mockQuote = jest.fn();
const mockCheckout = jest.fn();
const mockRetry = jest.fn();
const mockPaymentStatus = jest.fn();
const mockSnapPay = jest.fn();
const mockCart = {
  patchouliItems: [{ id: 'cart-fixture', product_id: 'product-fixture', quantity_kg: 1,
    product: { supplier_id: 'supplier-fixture', supplier_name: 'Supplier fixture', batch_code: 'BATCH-FIXTURE', price_per_kg: 960000, moq_kg: 1, available_volume_kg: 10 } }],
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

async function reviewCheckout() {
  fireEvent.change(screen.getByPlaceholderText('PIC / warehouse name'), { target: { value: 'Buyer fixture' } });
  fireEvent.change(screen.getByPlaceholderText('08xxxxxxxxxx'), { target: { value: '08000000000' } });
  fireEvent.change(screen.getByPlaceholderText('Full address: street, number, landmarks...'), { target: { value: 'Test fixture address' } });
  await selectDestination();
  await screen.findByText('Courier area-a — Cargo');
  fireEvent.click(screen.getByRole('button', { name: 'Proceed to Review & Payment' }));
  await screen.findByRole('heading', { name: 'Order Review' });
  fireEvent.click(screen.getByRole('checkbox'));
}

describe('Checkout courier quote loading', () => {
  const originalFetch = global.fetch;
  const originalSnap = window.snap;
  const originalRandomUUID = Object.getOwnPropertyDescriptor(crypto, 'randomUUID');
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('valam_token', 'checkout-test-token');
    Object.defineProperty(crypto, 'randomUUID', { configurable: true, value: () => '00000000-0000-4000-8000-000000000001' });
    mockSnapPay.mockImplementation((_token, callbacks) => callbacks.onClose());
    window.snap = { pay: mockSnapPay } as any;
    mockCart.fetchCart.mockResolvedValue(undefined);
    mockCheckout.mockResolvedValue(response({ orderId: 'order-fixture', orderNumber: 'ORDER-FIXTURE', snapToken: 'unit-snap-token' }));
    mockRetry.mockResolvedValue(response({ orderId: 'order-fixture', snapToken: 'unit-snap-token' }));
    mockPaymentStatus.mockResolvedValue(response({ paymentStatus: 'pending' }));
    mockQuote.mockImplementation(async (body: any) => rates(body.destinationAreaId));
    global.fetch = jest.fn(async (url: any, options?: any) => {
      const path = String(url);
      if (path.endsWith('/provinces.json')) return response([{ id: 'province', name: 'Province fixture' }]);
      if (path.includes('/regencies/')) return response([{ id: 'city', name: 'City fixture' }]);
      if (path.includes('/districts/')) return response([{ id: 'district-a', name: 'District A' }, { id: 'district-b', name: 'District B' }]);
      if (path.includes('/areas/search')) return response([{ id: decodeURIComponent(path).includes('District B') ? 'area-b' : 'area-a', postal_code: 12345 }]);
      if (path.endsWith('/shipment/quote')) return mockQuote(JSON.parse(options.body));
      if (path.endsWith('/orders/checkout')) return mockCheckout();
      if (path.endsWith('/retry-payment')) return mockRetry();
      if (path.includes('/payment/status/')) return mockPaymentStatus();
      throw Error(`Unexpected request: ${path}`);
    }) as any;
  });
  afterEach(() => {
    global.fetch = originalFetch; localStorage.clear(); window.snap = originalSnap;
    jest.useRealTimers();
    if (originalRandomUUID) Object.defineProperty(crypto, 'randomUUID', originalRandomUUID);
    else Reflect.deleteProperty(crypto, 'randomUUID');
  });

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

  it('waits for backend confirmation even when Snap calls onSuccess', async () => {
    mockSnapPay.mockImplementation((_token, callbacks) => callbacks.onSuccess({}));
    render(<CheckoutPage />);
    await reviewCheckout();
    jest.useFakeTimers();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Pay Now' })); });
    expect(mockSnapPay).toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Awaiting Payment' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Payment Successful!' })).not.toBeInTheDocument();
    await act(async () => { jest.advanceTimersByTime(5000); });
    expect(screen.getByRole('heading', { name: 'Awaiting Payment' })).toBeInTheDocument();
    mockPaymentStatus.mockResolvedValue(response({ paymentStatus: 'paid' }));
    await act(async () => { jest.advanceTimersByTime(5000); });
    expect(screen.getByRole('heading', { name: 'Payment Successful!' })).toBeInTheDocument();
  });

  it('leaves retry usable and shows an error when Snap is unavailable', async () => {
    render(<CheckoutPage />);
    await reviewCheckout();
    fireEvent.click(screen.getByRole('button', { name: 'Pay Now' }));
    await screen.findByRole('heading', { name: 'Payment Incomplete' });
    window.snap = undefined as any;
    fireEvent.click(screen.getByRole('button', { name: 'Continue Payment' }));
    expect(await screen.findByRole('heading', { name: 'Payment Failed' })).toBeInTheDocument();
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ description: expect.stringContaining('Snap could not be loaded') }));
    expect(screen.getByRole('button', { name: 'Retry Payment' })).toBeEnabled();
  });

  it('shows a review state for a payment received after the reservation ended', async () => {
    mockSnapPay.mockImplementation((_token, callbacks) => callbacks.onSuccess({}));
    mockPaymentStatus.mockResolvedValue(response({ paymentStatus: 'paid', orderStatus: 'PAYMENT_REVIEW' }));
    render(<CheckoutPage />);
    await reviewCheckout();
    jest.useFakeTimers();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Pay Now' })); });
    await act(async () => { jest.advanceTimersByTime(5000); });
    expect(screen.getByRole('heading', { name: 'Payment Requires Review' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Payment Successful!' })).not.toBeInTheDocument();
  });

  it('preserves the backend configuration error when retrying payment', async () => {
    render(<CheckoutPage />);
    await reviewCheckout();
    fireEvent.click(screen.getByRole('button', { name: 'Pay Now' }));
    await screen.findByRole('heading', { name: 'Payment Incomplete' });
    mockRetry.mockResolvedValue(response({ message: 'Sandbox Server Key required' }, false));
    fireEvent.click(screen.getByRole('button', { name: 'Continue Payment' }));
    await screen.findByRole('heading', { name: 'Payment Failed' });
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ description: 'Sandbox Server Key required' }));
    expect(screen.getByRole('button', { name: 'Retry Payment' })).toBeEnabled();
  });
});
