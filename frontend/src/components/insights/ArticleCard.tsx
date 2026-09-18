'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { InsightContentWithAuthor } from '@/lib/valam-insights/types';
import { cardVariants } from '@/lib/animations';
import { resolveArticleCategory } from './categories';

interface ArticleCardProps {
  article: InsightContentWithAuthor;
  locale: string;
  className?: string;
}

export function ArticleCard({ article, locale, className = '' }: ArticleCardProps) {
  const isEn = locale === 'en';
  const title = isEn && article.title_en ? article.title_en : article.title_id;
  const excerpt = isEn && article.excerpt_en ? article.excerpt_en : article.excerpt_id;
  const category = resolveArticleCategory(article, isEn);
  const readTime = article.read_time_minutes || 3;

  const dateLabel = new Date(article.published_at || article.created_at).toLocaleDateString(
    isEn ? 'en-US' : 'id-ID',
    { day: 'numeric', month: 'short', year: 'numeric' }
  );

  return (
    <motion.article
      variants={cardVariants}
      className={`group flex flex-col h-full rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm hover:shadow-md hover:border-emerald-700/25 hover:-translate-y-0.5 transition-all duration-300 ${className}`}
    >
      <Link
        href={`/${locale}/insights/${article.slug}`}
        className="flex flex-col h-full flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/30 rounded-xl"
      >
        <span className="inline-flex w-fit items-center px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] font-semibold mb-3">
          {category.label}
        </span>

        <h3 className="text-[15px] font-semibold text-zinc-900 tracking-tight leading-snug line-clamp-2 group-hover:text-emerald-800 transition-colors text-balance">
          {title}
        </h3>

        {excerpt && (
          <p className="mt-2 text-xs text-zinc-500 leading-relaxed line-clamp-2 flex-1">
            {excerpt}
          </p>
        )}

        <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
          <p className="text-[11px] text-zinc-500 tabular-nums">
            {dateLabel}
            <span className="mx-1.5 text-zinc-300" aria-hidden>
              ·
            </span>
            {readTime} {isEn ? 'min read' : 'min baca'}
          </p>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 group-hover:gap-1.5 transition-all shrink-0">
            {isEn ? 'Read' : 'Baca Artikel'}
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
