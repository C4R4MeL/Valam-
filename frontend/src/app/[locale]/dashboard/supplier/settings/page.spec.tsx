import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SupplierSettingsPage from './page';

jest.mock('next-intl', () => ({ useLocale: () => 'id' }));
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: jest.fn() }) }));
jest.mock('@/components/layout/DashboardHeader', () => ({ DashboardHeader: () => null }));
jest.mock('@/components/skeletons', () => ({ FormPageSkeleton: () => null }));

it('loads the origin postcode and sends the supplier-entered value to the existing profile endpoint', async () => {
  const originalFetch = global.fetch;
  const fetchMock = jest.fn().mockImplementation(async (_url, options) => ({
    ok: true,
    json: async () => options?.method === 'PATCH' ? { data: {} } : { data: { postal_code: '12345' } },
  }));
  global.fetch = fetchMock;
  try {
    render(<SupplierSettingsPage />);
    const postcode = await screen.findByLabelText('Kode Pos Asal Pengiriman');
    expect(postcode).toHaveValue('12345');
    fireEvent.change(postcode, { target: { value: '23456' } });
    fireEvent.submit(postcode.closest('form')!);
    await waitFor(() => expect(fetchMock.mock.calls.some(([, options]) => options?.method === 'PATCH')).toBe(true));
    const [url, options] = fetchMock.mock.calls.find(([, options]) => options?.method === 'PATCH')!;
    expect(url).toMatch(/\/suppliers\/me\/profile$/);
    expect(JSON.parse(options.body).postalCode).toBe('23456');
  } finally { global.fetch = originalFetch; }
});
