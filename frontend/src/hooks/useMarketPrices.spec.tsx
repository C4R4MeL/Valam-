import { act, renderHook, waitFor } from '@testing-library/react';
import { useMarketPrices } from './useMarketPrices';
import { getLatestMarketPrices } from '@/lib/valam-insights/insights-api';
import { MARKET_PRICES_UPDATED } from '@/lib/market-price-events';

jest.mock('@/lib/valam-insights/insights-api', () => ({ getLatestMarketPrices: jest.fn() }));
const load = jest.mocked(getLatestMarketPrices);
const price = (amount: number) => [{ id: 'source', grade: 'A' as const, price_per_kg: amount, currency: 'IDR', updated_at: '2026-10-30T03:00:00Z', updated_by: null }];

it('shares requests and refreshes every viewer after save, cross-tab changes, focus and polling', async () => {
  load.mockResolvedValue(price(923456));
  const first = renderHook(() => useMarketPrices());
  const second = renderHook(() => useMarketPrices());
  await waitFor(() => expect(first.result.current.prices[0]?.price_per_kg).toBe(923456));
  expect(load).toHaveBeenCalledTimes(1);
  expect(second.result.current.prices).toBe(first.result.current.prices);

  load.mockResolvedValue(price(987654));
  act(() => { window.dispatchEvent(new Event(MARKET_PRICES_UPDATED)); });
  await waitFor(() => expect(second.result.current.prices[0]?.price_per_kg).toBe(987654));
  expect(first.result.current.prices).toBe(second.result.current.prices);

  load.mockResolvedValue(price(998877));
  act(() => { window.dispatchEvent(new StorageEvent('storage', { key: MARKET_PRICES_UPDATED })); });
  await waitFor(() => expect(first.result.current.prices[0]?.price_per_kg).toBe(998877));

  load.mockResolvedValue(price(876543));
  act(() => { window.dispatchEvent(new Event('focus')); });
  await waitFor(() => expect(second.result.current.prices[0]?.price_per_kg).toBe(876543));

  jest.useFakeTimers();
  // Start a fresh subscription so its interval uses fake timers.
  first.unmount(); second.unmount();
  const third = renderHook(() => useMarketPrices());
  await act(async () => {});
  load.mockResolvedValue(price(654321));
  await act(async () => { jest.advanceTimersByTime(60_000); });
  expect(third.result.current.prices[0]?.price_per_kg).toBe(654321);

  load.mockRejectedValue(new Error('offline'));
  await act(async () => { window.dispatchEvent(new Event('focus')); });
  expect(third.result.current).toMatchObject({ prices: [], loading: false, fromLive: false, error: 'offline' });
  const calls = load.mock.calls.length;
  third.unmount();
  act(() => { jest.advanceTimersByTime(60_000); window.dispatchEvent(new Event('focus')); });
  expect(load).toHaveBeenCalledTimes(calls);
  jest.useRealTimers();
});

it('discards a stale read that was in flight when a save completed', async () => {
  let resolve!: (value: ReturnType<typeof price>) => void;
  load.mockImplementationOnce(() => new Promise(done => { resolve = done; })).mockResolvedValue(price(765432));
  const view = renderHook(() => useMarketPrices());
  await act(async () => {
    window.dispatchEvent(new Event(MARKET_PRICES_UPDATED));
    resolve(price(123456));
  });
  await waitFor(() => expect(view.result.current.prices[0]?.price_per_kg).toBe(765432));
  view.unmount();
});
