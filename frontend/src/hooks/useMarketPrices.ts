'use client';

import { useEffect, useState } from 'react';
import { getLatestMarketPrices } from '@/lib/valam-insights/insights-api';
import { mergeMarketPrices } from '@/lib/market-grades';
import type { InsightMarketPrice } from '@/lib/valam-insights/types';

export function useMarketPrices() {
  const [prices, setPrices] = useState<InsightMarketPrice[]>(() => mergeMarketPrices([]));
  const [loading, setLoading] = useState(true);
  const [fromLive, setFromLive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getLatestMarketPrices()
      .then((live) => {
        if (cancelled) return;
        const merged = mergeMarketPrices(live);
        setPrices(merged);
        setFromLive(Array.isArray(live) && live.length > 0);
      })
      .catch(() => {
        if (cancelled) return;
        setPrices(mergeMarketPrices([]));
        setFromLive(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { prices, loading, fromLive };
}
