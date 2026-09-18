'use client';

import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArticleCard } from './ArticleCard';
import type { InsightContentWithAuthor } from '@/lib/valam-insights/types';
import { gridVariants } from '@/lib/animations';

interface ArticleGridProps {
  articles: InsightContentWithAuthor[];
  locale: string;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

export function ArticleGrid({
  articles,
  locale,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: ArticleGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isEn = locale === 'en';
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: '120px' }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) observer.observe(currentSentinel);

    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
    };
  }, [hasMore, isLoadingMore, onLoadMore]);

  return (
    <div className="space-y-8">
      <motion.div
        variants={gridVariants}
        initial={prefersReducedMotion ? false : 'hidden'}
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5"
      >
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} locale={locale} />
        ))}
      </motion.div>

      <div ref={sentinelRef} className="pt-2 pb-2 text-center">
        {isLoadingMore && (
          <p className="text-xs text-zinc-400 font-medium">
            {isEn ? 'Loading more…' : 'Memuat lebih banyak…'}
          </p>
        )}
        {!hasMore && articles.length > 0 && (
          <p className="text-xs text-zinc-400 font-medium pt-2">
            {isEn ? 'You have reached the end' : 'Semua artikel telah dimuat'}
          </p>
        )}
      </div>
    </div>
  );
}
