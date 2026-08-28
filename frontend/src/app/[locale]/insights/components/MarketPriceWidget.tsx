'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getLatestMarketPrices } from '@/lib/valam-insights/insights-api';
import { formatPrice } from '@/lib/valam-insights/utils';
import type { InsightMarketPrice } from '@/lib/valam-insights/types';

interface MarketPriceWidgetProps {
  locale: string;
}

const gradeColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  A: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  B: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  C: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
};

export function MarketPriceWidget({ locale }: MarketPriceWidgetProps) {
  const [prices, setPrices] = useState<InsightMarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const isEn = locale === 'en';

  useEffect(() => {
    getLatestMarketPrices()
      .then(setPrices)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 animate-pulse">
        <div className="h-5 w-32 bg-zinc-100 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-zinc-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-emerald-800 to-emerald-900">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-300" />
          <h3 className="font-semibold text-sm text-white">
            {isEn ? 'Patchouli Oil Prices' : 'Harga Nilam Terkini'}
          </h3>
        </div>
        <p className="text-xs text-emerald-300 mt-1">
          {isEn ? 'Updated price per kg' : 'Harga per kg terbaru'}
        </p>
      </div>

      {/* Prices */}
      <div className="p-4 space-y-2">
        {prices.map((price) => {
          const colors = gradeColors[price.grade] || gradeColors.C;
          return (
            <div
              key={price.id}
              className={`flex items-center justify-between p-3 rounded-xl ${colors.bg} border ${colors.border} transition-all hover:shadow-sm`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                <span className={`text-sm font-bold ${colors.text}`}>
                  Grade {price.grade}
                </span>
              </div>
              <span className={`text-sm font-bold ${colors.text}`}>
                {formatPrice(price.price_per_kg, price.currency)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Last updated */}
      {prices.length > 0 && (
        <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50">
          <p className="text-xs text-zinc-400 text-center">
            {isEn ? 'Last updated' : 'Terakhir diperbarui'}:{' '}
            {new Date(prices[0].updated_at).toLocaleDateString(
              locale === 'id' ? 'id-ID' : 'en-US',
              { day: 'numeric', month: 'short', year: 'numeric' }
            )}
          </p>
        </div>
      )}
    </div>
  );
}
