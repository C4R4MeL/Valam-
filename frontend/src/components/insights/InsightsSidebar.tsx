'use client';

import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, Flame, ArrowUpRight, ArrowDownRight, Compass, UserPlus } from 'lucide-react';
import { SparklineChart } from './SparklineChart';
import { getLatestMarketPrices } from '@/lib/valam-insights/insights-api';
import { formatPrice } from '@/lib/valam-insights/utils';
import type { InsightMarketPrice, InsightContentWithAuthor } from '@/lib/valam-insights/types';

interface InsightsSidebarProps {
  locale: string;
  popularArticles: InsightContentWithAuthor[];
}

const gradeColors: Record<string, { bg: string; text: string; border: string; dot: string; trend: string; trendColor: string; trendIcon: any; sparkData: number[]; sparkColor: string }> = {
  A: { 
    bg: 'hover:bg-emerald-50/50', 
    text: 'text-emerald-700', 
    border: 'border-emerald-100', 
    dot: 'bg-emerald-500',
    trend: '+2.5%',
    trendColor: 'text-emerald-600 bg-emerald-50',
    trendIcon: ArrowUpRight,
    sparkData: [810000, 815000, 820000, 825000, 830000, 835000, 840000],
    sparkColor: '#10B981'
  },
  B: { 
    bg: 'hover:bg-blue-50/50', 
    text: 'text-blue-700', 
    border: 'border-blue-100', 
    dot: 'bg-blue-500',
    trend: '0.0%',
    trendColor: 'text-zinc-500 bg-zinc-50',
    trendIcon: ArrowUpRight,
    sparkData: [780000, 780000, 781000, 780000, 779000, 780000, 780000],
    sparkColor: '#3B82F6'
  },
  C: { 
    bg: 'hover:bg-amber-50/50', 
    text: 'text-amber-700', 
    border: 'border-amber-100', 
    dot: 'bg-amber-500',
    trend: '-1.2%',
    trendColor: 'text-rose-600 bg-rose-50',
    trendIcon: ArrowDownRight,
    sparkData: [720000, 730000, 715000, 725000, 710000, 718000, 712000],
    sparkColor: '#F59E0B'
  },
};

export function InsightsSidebar({ locale, popularArticles }: InsightsSidebarProps) {
  const [prices, setPrices] = useState<InsightMarketPrice[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const isEn = locale === 'en';
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    getLatestMarketPrices()
      .then(setPrices)
      .catch(console.error)
      .finally(() => setLoadingPrices(false));
  }, []);

  return (
    <div className="space-y-8 sticky top-28">
      
      {/* 1. Widget Harga Nilam Terkini */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-5 py-4 bg-zinc-950 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">📈</span>
            <h3 className="font-semibold text-xs text-white uppercase tracking-wider">
              {isEn ? 'Patchouli Market' : 'Harga Nilam'}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Live</span>
          </div>
        </div>

        {/* Price rows */}
        <div className="p-4 space-y-2">
          {loadingPrices ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[68px] bg-zinc-100 animate-pulse rounded-xl" />
            ))
          ) : (
            prices.map((price, idx) => {
              const config = gradeColors[price.grade] || gradeColors.C;
              const TrendIcon = config.trendIcon;
              return (
                <div
                  key={price.id}
                  className={`flex items-center justify-between py-3 transition-all duration-300 ${config.bg} ${idx < prices.length - 1 ? 'border-b border-surface-700' : ''}`}
                >
                  {/* Left: Grade dot & label */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
                      <span className="text-xs font-bold text-zinc-900 uppercase">
                        Grade {price.grade}
                      </span>
                    </div>
                    {/* Trend percent badge */}
                    <div className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold ${config.trendColor}`}>
                      <TrendIcon className="w-2.5 h-2.5" />
                      {config.trend}
                    </div>
                  </div>

                  {/* Center: Sparkline SVG */}
                  <div className="mx-2 shrink-0">
                    <SparklineChart data={config.sparkData} color={config.sparkColor} />
                  </div>

                  {/* Right: Price */}
                  <span className="text-xs font-mono font-extrabold text-zinc-950">
                    {formatPrice(price.price_per_kg, price.currency)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer date */}
        {prices.length > 0 && (
          <div className="px-5 py-2.5 border-t border-zinc-200/60">
            <p className="text-[10px] font-medium text-warm-400 text-center uppercase tracking-wider">
              {isEn ? 'Last updated' : 'Terakhir diperbarui'}:{' '}
              {new Date(prices[0].updated_at).toLocaleDateString(
                locale === 'id' ? 'id-ID' : 'en-US',
                { day: 'numeric', month: 'short', year: 'numeric' }
              )}
            </p>
          </div>
        )}
      </div>

      {/* 2. Widget Artikel Populer */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
          <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          <h3 className="font-semibold text-xs text-zinc-800 uppercase tracking-wider">
            {isEn ? 'Trending Weekly' : 'Populer Minggu Ini'}
          </h3>
        </div>

        <div className="space-y-4">
          {popularArticles.length === 0 ? (
            <p className="text-xs text-zinc-400 italic">No popular content found</p>
          ) : (
            popularArticles.slice(0, 3).map((art, index) => {
              const rank = `0${index + 1}`;
              const artTitle = isEn && art.title_en ? art.title_en : art.title_id;
              return (
                <Link 
                  key={art.id} 
                  href={`/${locale}/insights/${art.slug}`}
                  className="flex gap-3.5 items-start group/pop"
                >
                  {/* Rank Counter */}
                  <span className="font-mono text-2xl font-bold text-amber-400 leading-none">
                    {rank}
                  </span>

                  {/* Title & metadata */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <h4 className="text-xs font-bold text-zinc-950 leading-snug line-clamp-2 transition-all relative overflow-hidden">
                      {artTitle}
                      {/* Underline slide effect */}
                      <span className="absolute bottom-0 left-0 w-full h-[1px] bg-emerald-700 origin-left scale-x-0 group-hover/pop:scale-x-100 transition-transform duration-300" />
                    </h4>
                    <p className="text-[10px] text-warm-300 font-medium">
                      📖 {art.read_time_minutes} Min {isEn ? 'read' : 'baca'}
                    </p>
                  </div>

                  {/* Thumbnail cover */}
                  {art.cover_image_url && (
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-zinc-100 shrink-0">
                      <Image
                        src={art.cover_image_url}
                        alt={artTitle}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* 3. Widget CTA Jelajahi & Gabung */}
      <div className="rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-[#0D2818] to-[#051c10] p-6 shadow-xl relative overflow-hidden text-white">
        {/* Absolute Background Accent Decors */}
        <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-24 h-24 rounded-full bg-amber-500/10 blur-xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">Valam Portal</span>
            <h3 className="font-serif text-lg font-bold text-white tracking-tight leading-tight">
              {isEn ? 'Grow Your Patchouli Network' : 'Mulai Sekarang'}
            </h3>
            <p className="text-[11px] text-white/60 leading-relaxed font-sans">
              {isEn ? 'Access our certified global B2B essential oil trade platform.' : 'Hubungkan perdagangan minyak atsiri Anda ke ekosistem global terpercaya.'}
            </p>
          </div>

          <div className="space-y-3.5 pt-1">
            {/* Outline Button */}
            <a
              href={`/${locale}/marketplace`}
              className="flex items-center justify-center gap-2 w-full py-3 text-xs font-bold uppercase tracking-wider rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30 text-white transition-all text-center"
            >
              <Compass className="w-4 h-4" />
              {isEn ? 'Browse Marketplace' : 'Jelajahi Marketplace'}
            </a>

            {/* Glowing Solid Gold Button */}
            <motion.a
              href={`/${locale}/register`}
              animate={prefersReducedMotion ? {} : {
                boxShadow: [
                  "0 0 0 0 rgba(245,158,11,0)",
                  "0 0 0 8px rgba(245,158,11,0.25)",
                  "0 0 0 0 rgba(245,158,11,0)"
                ]
              }}
              transition={prefersReducedMotion ? {} : {
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="flex items-center justify-center gap-2 w-full py-3 text-xs font-extrabold uppercase tracking-wider rounded-xl bg-amber-500 hover:bg-amber-400 text-emerald-950 transition-all text-center"
            >
              <UserPlus className="w-4 h-4 text-emerald-950 fill-emerald-950" />
              {isEn ? 'Join as Supplier' : 'Gabung Supplier'}
            </motion.a>
          </div>
        </div>
      </div>

    </div>
  );
}
