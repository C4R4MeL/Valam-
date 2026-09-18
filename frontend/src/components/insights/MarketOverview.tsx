'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, ArrowDownRight, Minus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getLatestMarketPrices, getMarketPriceHistory } from '@/lib/valam-insights/insights-api';
import { formatPrice } from '@/lib/valam-insights/utils';
import type { InsightMarketPrice } from '@/lib/valam-insights/types';

interface MarketOverviewProps {
  locale: string;
  /** Compact variant for hero strip */
  variant?: 'hero' | 'section';
}

interface PriceSnapshot {
  price: InsightMarketPrice | null;
  weeklyChangePct: number | null;
  isPlaceholder: boolean;
  updatedAt: string | null;
}

const PLACEHOLDER: PriceSnapshot = {
  price: {
    id: 'placeholder',
    grade: 'A',
    price_per_kg: 450000,
    currency: 'IDR',
    updated_by: null,
    updated_at: new Date().toISOString(),
  },
  weeklyChangePct: 2.4,
  isPlaceholder: true,
  updatedAt: new Date().toISOString(),
};

function formatChange(pct: number | null, isEn: boolean) {
  if (pct === null) return isEn ? '—' : '—';
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

export function MarketOverview({ locale, variant = 'section' }: MarketOverviewProps) {
  const isEn = locale === 'en';
  const [snapshot, setSnapshot] = useState<PriceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const prices = await getLatestMarketPrices();
        const gradeA = prices.find((p) => p.grade === 'A') || prices[0] || null;

        let weeklyChangePct: number | null = null;
        if (gradeA) {
          try {
            const history = await getMarketPriceHistory(gradeA.grade, 14);
            if (history.length >= 2) {
              const latest = history[0].price_per_kg;
              const weekAgo = history[Math.min(6, history.length - 1)].price_per_kg;
              if (weekAgo > 0) {
                weeklyChangePct = ((latest - weekAgo) / weekAgo) * 100;
              }
            }
          } catch {
            // History optional — keep null
          }
        }

        if (!cancelled) {
          if (gradeA) {
            setSnapshot({
              price: gradeA,
              weeklyChangePct,
              isPlaceholder: false,
              updatedAt: gradeA.updated_at,
            });
          } else {
            setSnapshot(PLACEHOLDER);
          }
        }
      } catch {
        if (!cancelled) setSnapshot(PLACEHOLDER);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const data = snapshot || PLACEHOLDER;
  const change = data.weeklyChangePct;
  const isUp = change !== null && change > 0;
  const isDown = change !== null && change < 0;
  const TrendIcon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : Minus;
  const trendColor = isUp
    ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
    : isDown
      ? 'text-rose-700 bg-rose-50 border-rose-100'
      : 'text-zinc-600 bg-zinc-50 border-zinc-100';

  const updatedLabel = data.updatedAt
    ? new Date(data.updatedAt).toLocaleDateString(isEn ? 'en-US' : 'id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  if (variant === 'hero') {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: isEn ? 'Aceh patchouli oil' : 'Harga minyak nilam',
            value: loading
              ? '…'
              : formatPrice(data.price!.price_per_kg, data.price!.currency),
            sub: isEn ? 'Grade A / kg' : 'Grade A / Kg',
          },
          {
            label: isEn ? 'Weekly change' : 'Perubahan minggu ini',
            value: loading ? '…' : formatChange(change, isEn),
            sub: isUp
              ? isEn
                ? 'Trending up'
                : 'Tren naik'
              : isDown
                ? isEn
                  ? 'Trending down'
                  : 'Tren turun'
                : isEn
                  ? 'Stable'
                  : 'Stabil',
          },
          {
            label: isEn ? 'Demand trend' : 'Tren permintaan',
            value: isEn ? 'Steady' : 'Stabil',
            sub: isEn ? 'Export & domestic' : 'Ekspor & domestik',
          },
          {
            label: isEn ? 'Patchouli Alcohol' : 'Patchouli Alcohol',
            value: '≥ 30%',
            sub: isEn ? 'Grade A reference' : 'Acuan Grade A',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-zinc-200/80 bg-white px-4 py-3.5 sm:px-5 sm:py-4 shadow-sm"
          >
            <p className="text-[11px] sm:text-xs font-medium text-zinc-500 mb-1.5">
              {stat.label}
            </p>
            <p className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight tabular-nums">
              {stat.value}
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section
      aria-labelledby="market-overview-heading"
      className="rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white shadow-sm shadow-zinc-200/40 overflow-hidden"
    >
      <div className="grid grid-cols-1 md:grid-cols-12">
        <div className="md:col-span-8 p-5 sm:p-7 lg:p-8 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id="market-overview-heading"
              className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight"
            >
              {isEn ? 'Aceh Patchouli Oil Price' : 'Harga Minyak Nilam Aceh'}
            </h2>
            {data.isPlaceholder && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold">
                <Info className="w-3 h-3" />
                {isEn ? 'Sample data' : 'Data contoh'}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-8">
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-emerald-800 tracking-tight tabular-nums">
                {loading
                  ? '…'
                  : formatPrice(data.price!.price_per_kg, data.price!.currency)}
              </p>
              <p className="text-sm text-zinc-500 mt-1">
                {isEn ? 'per kg · Grade A' : '/ Kg · Grade A'}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="min-w-[140px]">
                <p className="text-xs text-zinc-500 mb-1">
                  {isEn ? 'Change this week' : 'Perubahan minggu ini'}
                </p>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-sm font-semibold tabular-nums ${trendColor}`}
                >
                  <TrendIcon className="w-3.5 h-3.5" />
                  {loading ? '…' : formatChange(change, isEn)}
                </span>
              </div>
              <div className="min-w-[140px]">
                <p className="text-xs text-zinc-500 mb-1">
                  {isEn ? 'Last updated' : 'Update terakhir'}
                </p>
                <p className="text-sm font-medium text-zinc-800">{updatedLabel}</p>
              </div>
            </div>
          </div>

          {data.isPlaceholder && (
            <p className="text-xs text-zinc-500 leading-relaxed max-w-xl">
              {isEn
                ? 'Live market prices are not connected yet. Figures shown are illustrative placeholders and will be replaced by API data.'
                : 'Harga real-time belum terhubung. Angka di atas adalah placeholder ilustratif dan akan diganti data API.'}
            </p>
          )}
        </div>

        <div className="md:col-span-4 bg-emerald-50/70 border-t md:border-t-0 md:border-l border-zinc-100 p-5 sm:p-7 flex flex-col justify-center gap-3">
          <p className="text-sm text-zinc-600 leading-relaxed">
            {isEn
              ? 'Explore grades, PA levels, and what moves patchouli prices week to week.'
              : 'Pelajari grade, kadar PA, dan faktor yang menggerakkan harga nilam dari minggu ke minggu.'}
          </p>
          <Button
            asChild
            className="w-full sm:w-auto h-11 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-medium shadow-md shadow-emerald-950/10"
          >
            <Link href={`/${locale}/insights?focus=harga`}>
              {isEn ? 'View price details' : 'Lihat Detail Harga'}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
