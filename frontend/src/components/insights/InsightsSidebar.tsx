'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, ArrowDownRight, Minus, Info } from 'lucide-react';
import { getLatestMarketPrices, getMarketPriceHistory } from '@/lib/valam-insights/insights-api';
import { formatPrice } from '@/lib/valam-insights/utils';
import type { InsightContentWithAuthor, InsightMarketPrice } from '@/lib/valam-insights/types';

interface InsightsSidebarProps {
  locale: string;
  popularArticles: InsightContentWithAuthor[];
}

export function InsightsSidebar({ locale, popularArticles }: InsightsSidebarProps) {
  const isEn = locale === 'en';
  const [price, setPrice] = useState<InsightMarketPrice | null>(null);
  const [weeklyChange, setWeeklyChange] = useState<number | null>(null);
  const [isPlaceholder, setIsPlaceholder] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const prices = await getLatestMarketPrices();
        const gradeA = prices.find((p) => p.grade === 'A') || prices[0] || null;

        if (!gradeA) {
          if (!cancelled) {
            setPrice({
              id: 'placeholder',
              grade: 'A',
              price_per_kg: 450000,
              currency: 'IDR',
              updated_by: null,
              updated_at: new Date().toISOString(),
            });
            setWeeklyChange(2.4);
            setIsPlaceholder(true);
          }
          return;
        }

        let change: number | null = null;
        try {
          const history = await getMarketPriceHistory(gradeA.grade, 14);
          if (history.length >= 2) {
            const latest = history[0].price_per_kg;
            const weekAgo = history[Math.min(6, history.length - 1)].price_per_kg;
            if (weekAgo > 0) change = ((latest - weekAgo) / weekAgo) * 100;
          }
        } catch {
          // optional
        }

        if (!cancelled) {
          setPrice(gradeA);
          setWeeklyChange(change);
          setIsPlaceholder(false);
        }
      } catch {
        if (!cancelled) {
          setPrice({
            id: 'placeholder',
            grade: 'A',
            price_per_kg: 450000,
            currency: 'IDR',
            updated_by: null,
            updated_at: new Date().toISOString(),
          });
          setWeeklyChange(2.4);
          setIsPlaceholder(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const isUp = weeklyChange !== null && weeklyChange > 0;
  const isDown = weeklyChange !== null && weeklyChange < 0;
  const TrendIcon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : Minus;
  const trendLabel =
    weeklyChange === null
      ? '—'
      : `${weeklyChange > 0 ? '+' : ''}${weeklyChange.toFixed(1)}%`;
  const directionLabel = isUp
    ? isEn
      ? 'Up'
      : 'Naik'
    : isDown
      ? isEn
        ? 'Down'
        : 'Turun'
      : isEn
        ? 'Stable'
        : 'Stabil';

  const updatedLabel = price?.updated_at
    ? new Date(price.updated_at).toLocaleDateString(isEn ? 'en-US' : 'id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  const popularTitlesFallback = [
    isEn ? 'What is Patchouli Alcohol?' : 'Apa Itu Patchouli Alcohol?',
    isEn ? 'Why Patchouli Prices Move Weekly?' : 'Mengapa Harga Minyak Nilam Berubah?',
    isEn ? 'Global Patchouli Demand Trends' : 'Tren Permintaan Minyak Nilam Global',
  ];

  return (
    <aside className="space-y-6 sticky top-28">
      {/* Market Snapshot */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-zinc-100 bg-emerald-950">
          <h3 className="text-xs font-semibold text-white tracking-wide">
            {isEn ? 'Market Snapshot' : 'Market Snapshot'}
          </h3>
        </div>

        <div className="p-5 space-y-4">
          {isPlaceholder && (
            <p className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
              <Info className="w-3 h-3" />
              {isEn ? 'Sample data' : 'Data contoh'}
            </p>
          )}

          <div>
            <p className="text-xs text-zinc-500 mb-1">
              {isEn ? 'Patchouli oil price' : 'Harga Minyak Nilam'}
            </p>
            <p className="text-xl font-bold text-zinc-900 tabular-nums tracking-tight">
              {loading || !price
                ? '…'
                : formatPrice(price.price_per_kg, price.currency)}
              <span className="text-sm font-medium text-zinc-500 ml-1">/ Kg</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] text-zinc-500 mb-0.5">
                {isEn ? 'Weekly change' : 'Perubahan Mingguan'}
              </p>
              <p
                className={`text-sm font-semibold tabular-nums inline-flex items-center gap-0.5 ${
                  isUp ? 'text-emerald-700' : isDown ? 'text-rose-700' : 'text-zinc-700'
                }`}
              >
                <TrendIcon className="w-3.5 h-3.5" />
                {loading ? '…' : trendLabel}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-zinc-500 mb-0.5">
                {isEn ? 'Trend' : 'Trend'}
              </p>
              <p className="text-sm font-semibold text-zinc-800">
                {isUp ? '↗ ' : isDown ? '↘ ' : '→ '}
                {directionLabel}
              </p>
            </div>
          </div>

          <div>
            <p className="text-[11px] text-zinc-500 mb-0.5">
              {isEn ? 'Updated' : 'Update'}
            </p>
            <p className="text-sm font-medium text-zinc-800">{updatedLabel}</p>
          </div>

          <Link
            href={`/${locale}/insights?focus=harga`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 group/link"
          >
            {isEn ? 'View market data' : 'Lihat Market Data'}
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* Popular this week */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
        <h3 className="text-xs font-semibold text-zinc-800 tracking-wide pb-3 border-b border-zinc-100 mb-3">
          {isEn ? 'Popular this week' : 'Populer Minggu Ini'}
        </h3>

        <ol className="space-y-3.5">
          {(popularArticles.length > 0
            ? popularArticles.slice(0, 3).map((art) => ({
                id: art.id,
                slug: art.slug,
                title: isEn && art.title_en ? art.title_en : art.title_id,
              }))
            : popularTitlesFallback.map((title, i) => ({
                id: `fallback-${i}`,
                slug: '',
                title,
              }))
          ).map((item, index) => {
            const href = item.slug
              ? `/${locale}/insights/${item.slug}`
              : `/${locale}/insights`;
            const rank = String(index + 1).padStart(2, '0');

            return (
              <li key={item.id}>
                <Link href={href} className="flex gap-3 items-start group/pop">
                  <span className="text-sm font-bold text-[#C8922A] tabular-nums shrink-0 pt-0.5">
                    {rank}
                  </span>
                  <span className="text-sm font-medium text-zinc-800 leading-snug line-clamp-2 group-hover/pop:text-emerald-800 transition-colors">
                    {item.title}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </aside>
  );
}
