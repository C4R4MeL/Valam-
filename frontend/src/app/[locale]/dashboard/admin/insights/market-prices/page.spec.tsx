import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MarketPricesPage from './page';
import { getLatestMarketPrices, getMarketPriceHistory, updateMarketPrice } from '@/lib/valam-insights/insights-api';

jest.mock('@/i18n/routing', () => ({ Link: ({ children }: any) => <a>{children}</a> }));
jest.mock('@/lib/valam-insights/insights-api', () => ({
  getLatestMarketPrices: jest.fn(), getMarketPriceHistory: jest.fn(), updateMarketPrice: jest.fn(),
}));

const row = { id: 'source', grade: 'A', price_per_kg: 923456, currency: 'IDR', updated_at: '2026-10-30T03:00:00Z' };
beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(getLatestMarketPrices).mockResolvedValue([row as any]);
  jest.mocked(getMarketPriceHistory).mockResolvedValue([]);
});

it('shows the persisted value and success even when history refresh fails', async () => {
  jest.mocked(updateMarketPrice).mockResolvedValue({ ...row, price_per_kg: 987654 } as any);
  render(<MarketPricesPage />);
  const input = await screen.findByLabelText('Harga baru (IDR per kg)');
  jest.mocked(getMarketPriceHistory).mockRejectedValue(new Error('history offline'));
  fireEvent.change(input, { target: { value: '987654' } });
  fireEvent.click(screen.getByText('Update'));
  await waitFor(() => expect(updateMarketPrice).toHaveBeenCalledWith('source', 987654));
  expect(await screen.findByRole('status')).toHaveTextContent('berhasil diperbarui');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(input).toHaveValue(987654);
});

it('keeps the saved value unchanged and displays the API error on rejection', async () => {
  jest.mocked(updateMarketPrice).mockRejectedValue(new Error('Sesi berakhir'));
  render(<MarketPricesPage />);
  fireEvent.change(await screen.findByLabelText('Harga baru (IDR per kg)'), { target: { value: '987654' } });
  fireEvent.click(screen.getByText('Update'));
  expect(await screen.findByRole('alert')).toHaveTextContent('Sesi berakhir');
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.getByText(/923.456/)).toBeInTheDocument();
});
