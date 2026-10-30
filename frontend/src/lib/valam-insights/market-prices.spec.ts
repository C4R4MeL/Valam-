import { getLatestMarketPrices, getMarketPriceHistory, updateMarketPrice } from './insights-api';
import { MARKET_PRICES_UPDATED } from '@/lib/market-price-events';

jest.mock('@/lib/supabase/client', () => ({ createClient: jest.fn(() => { throw new Error('Market prices must use the backend'); }) }));

describe('market price API', () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    localStorage.clear();
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it('reads prices and history from the same backend without cache', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => [] });
    await getLatestMarketPrices();
    await getMarketPriceHistory('A', 10);
    expect(fetchMock).toHaveBeenNthCalledWith(1, expect.stringMatching(/\/market-prices$/), { cache: 'no-store' });
    expect(fetchMock).toHaveBeenNthCalledWith(2, expect.stringMatching(/\/market-prices\/A\/history\?limit=10$/), { cache: 'no-store' });
  });

  it('saves using the application session and only notifies viewers after success', async () => {
    localStorage.setItem('valam_token', 'admin-session');
    const row = { id: 'record', grade: 'A', price_per_kg: 923456 };
    fetchMock.mockResolvedValue({ ok: true, json: async () => row });
    const notified = jest.fn();
    window.addEventListener(MARKET_PRICES_UPDATED, notified);
    try {
      expect(await updateMarketPrice('record', 923456)).toEqual(row);
      expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/market-prices\/record$/), {
        cache: 'no-store', method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer admin-session' },
        body: JSON.stringify({ price_per_kg: 923456 }),
      });
      expect(notified).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem(MARKET_PRICES_UPDATED)).not.toBeNull();
      fetchMock.mockResolvedValue({ ok: false, json: async () => ({ message: 'Forbidden' }) });
      await expect(updateMarketPrice('record', 923456)).rejects.toThrow('Forbidden');
      expect(notified).toHaveBeenCalledTimes(1);
    } finally { window.removeEventListener(MARKET_PRICES_UPDATED, notified); }
  });

  it('rejects missing sessions and nonfinite or nonpositive prices before sending a request', async () => {
    await expect(updateMarketPrice('record', 923456)).rejects.toThrow('Sesi berakhir');
    for (const price of [NaN, Infinity, 0, -10]) {
      await expect(updateMarketPrice('record', price)).rejects.toThrow('angka positif');
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
