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

const getGridSpanClass = (index: number) => {
  const position = index % 5;
  if (position === 0) {
    // Wide Card (takes 2 columns)
    return 'col-span-1 md:col-span-2 h-full';
  } else {
    // Regular Card (takes 1 column)
    return 'col-span-1 h-full';
  }
};

const getImageHeightClass = (index: number) => {
  const position = index % 5;
  if (position === 0) {
    return 'h-64 md:h-72';
  } else {
    return 'h-48';
  }
};

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

  // Intersection Observer for infinite scrolling
  useEffect(() => {
    if (!hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: '100px' }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [hasMore, isLoadingMore, onLoadMore]);

  return (
    <div className="space-y-12">
      {/* Self-contained CSS for slim loading bar animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes flowBar {
          0% { left: -100%; width: 30%; }
          50% { left: 30%; width: 40%; }
          100% { left: 100%; width: 30%; }
        }
        .flow-loading-bar {
          position: relative;
          height: 3px;
          width: 100%;
          background: rgba(16, 185, 129, 0.1);
          overflow: hidden;
          border-radius: 9999px;
        }
        .flow-loading-bar-inner {
          position: absolute;
          height: 100%;
          background: #10B981;
          animation: flowBar 1.5s infinite ease-in-out;
        }
      `}} />

      {/* Bento Grid */}
      <motion.div
        variants={gridVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8 auto-rows-fr"
      >
        {articles.map((article, index) => (
          <ArticleCard
            key={article.id}
            article={article}
            locale={locale}
            className={getGridSpanClass(index)}
            imageHeightClass={getImageHeightClass(index)}
          />
        ))}
      </motion.div>

      {/* Infinite Scroll Sentinel & Loader */}
      <div ref={sentinelRef} className="pt-8 pb-4 text-center">
        {isLoadingMore && (
          <div className="space-y-6">
            {/* Animated separator "─── Memuat lebih banyak ───" */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-zinc-400 font-bold uppercase tracking-widest"
            >
              ─── {isEn ? 'Loading more articles' : 'Memuat lebih banyak'} ───
            </motion.p>

            {/* Slim moving emerald loading bar */}
            <div className="max-w-xs mx-auto">
              <div className="flow-loading-bar">
                <div className="flow-loading-bar-inner" />
              </div>
            </div>
          </div>
        )}

        {!hasMore && articles.length > 0 && (
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest pt-4">
            ─── {isEn ? 'End of insights feed' : 'Semua wawasan telah dimuat'} ───
          </p>
        )}
      </div>
    </div>
  );
}
