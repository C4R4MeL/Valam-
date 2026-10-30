'use client';

import { useSyncExternalStore } from 'react';
import { getLatestMarketPrices } from '@/lib/valam-insights/insights-api';
import { mergeMarketPrices } from '@/lib/market-grades';
import { MARKET_PRICES_UPDATED } from '@/lib/market-price-events';
import type { InsightMarketPrice } from '@/lib/valam-insights/types';

const initial = { prices: [] as InsightMarketPrice[], loading: true, fromLive: false, error: null as string | null };
let snapshot = initial;
let pending: Promise<void> | null = null;
let revision = 0;
const listeners = new Set<() => void>();
let stopWatching: (() => void) | null = null;

function refresh() {
  if (pending) return pending;
  const requestRevision = revision;
  pending = getLatestMarketPrices()
    .then(live => {
      if (requestRevision !== revision) return;
      const prices = mergeMarketPrices(live);
      snapshot = { prices, loading: false, fromLive: prices.length > 0, error: null };
    })
    .catch(error => {
      if (requestRevision !== revision) return;
      snapshot = { prices: [], loading: false, fromLive: false, error: error instanceof Error ? error.message : 'Gagal memuat harga' };
    })
    .finally(() => {
      pending = null;
      if (requestRevision !== revision) { void refresh(); return; }
      listeners.forEach(listener => listener());
    });
  return pending;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    const invalidate = () => { revision++; void refresh(); };
    const onStorage = (event: StorageEvent) => {
      if (event.key === MARKET_PRICES_UPDATED || event.key === null) invalidate();
    };
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    window.addEventListener(MARKET_PRICES_UPDATED, invalidate);
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onVisible);
    document.addEventListener('visibilitychange', onVisible);
    const timer = window.setInterval(onVisible, 60_000);
    stopWatching = () => {
      window.removeEventListener(MARKET_PRICES_UPDATED, invalidate);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
    };
    void refresh();
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) { stopWatching?.(); stopWatching = null; }
  };
}

export function useMarketPrices() {
  return useSyncExternalStore(subscribe, () => snapshot, () => initial);
}
