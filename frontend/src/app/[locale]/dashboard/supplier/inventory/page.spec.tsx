jest.mock('@/i18n/routing', () => ({ Link: ({ href, children }: any) => <a href={href}>{children}</a> }));
import { render, screen, waitFor } from '@testing-library/react';
import InventoryPage from './page';

jest.mock('next-intl', () => ({ useLocale: () => 'id' }));
jest.mock('@/components/layout/DashboardHeader', () => ({ DashboardHeader: () => <h1>Inventori</h1> }));
jest.mock('@/components/qc/CoAViewer', () => ({ CoAViewer: () => null }));
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: jest.fn() }) }));

describe('Supplier inventory read flow (mock HTTP transport)', () => {
  const previousFetch = global.fetch;
  afterEach(() => { global.fetch = previousFetch; localStorage.clear(); });
  it('reads token-owned batches without requiring an identity profile and uses the recorded creation date', async () => {
    localStorage.setItem('valam_token', 'unit-test-token');
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [{
      id: 'demo-batch', batch_code: 'DEMO-READ-ONLY', status: 'DRAFT',
      available_volume_kg: 500, price_per_kg: 850000, created_at: '2026-01-03T00:00:00Z',
    }] }) });
    global.fetch = fetchMock;
    render(<InventoryPage />);
    expect(await screen.findByText('DEMO-READ-ONLY')).toBeInTheDocument();
    expect(screen.getByText('3/1/2026')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/products\/mine$/);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer unit-test-token');
  });
  it('keeps API failure visible instead of silently claiming empty inventory', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
    render(<InventoryPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Gagal memuat daftar batch.'));
  });
});
