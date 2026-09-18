'use client';

import { Search } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { MarketOverview } from './MarketOverview';

interface InsightsHeroProps {
  locale: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setPage: (page: number) => void;
}

export function InsightsHero({
  locale,
  searchQuery,
  setSearchQuery,
  setPage,
}: InsightsHeroProps) {
  const isEn = locale === 'en';
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative pt-28 sm:pt-32 pb-8 sm:pb-10 border-b border-zinc-200/70 overflow-hidden bg-transparent">
      {/* Soft brand atmosphere — lets page grid show through */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 0% 0%, rgba(27, 94, 58, 0.04), transparent 55%),
            radial-gradient(ellipse 50% 40% at 100% 20%, rgba(200, 146, 42, 0.035), transparent 50%)
          `,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          <h1
            className="text-3xl sm:text-4xl md:text-[2.75rem] font-serif font-bold text-zinc-900 tracking-tight leading-[1.15] text-balance"
          >
            {isEn ? 'Patchouli Oil Insights' : 'Insights Minyak Nilam'}
          </h1>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-zinc-600 leading-relaxed max-w-2xl text-pretty">
            {isEn
              ? 'Market information, pricing, quality, and industry trends to help you make better patchouli decisions.'
              : 'Informasi pasar, harga, kualitas, dan tren industri minyak nilam untuk membantu Anda mengambil keputusan yang lebih tepat.'}
          </p>
        </motion.div>

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 sm:mt-8 max-w-xl"
        >
          <label htmlFor="insights-search" className="sr-only">
            {isEn ? 'Search insights' : 'Cari insights'}
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              id="insights-search"
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder={
                isEn
                  ? 'Search prices, quality, supply chain…'
                  : 'Cari harga, kualitas, rantai pasok…'
              }
              className="w-full h-11 sm:h-12 pl-10 pr-4 rounded-xl bg-white border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-600 transition-shadow shadow-sm"
            />
          </div>
        </motion.div>

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 sm:mt-8"
        >
          <MarketOverview locale={locale} variant="hero" />
        </motion.div>
      </div>
    </section>
  );
}
