'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Clock } from 'lucide-react';
import type { InsightContentWithAuthor } from '@/lib/valam-insights/types';
import { resolveArticleCategory } from './categories';

interface FeaturedArticleProps {
  article: InsightContentWithAuthor;
  locale: string;
}

export function FeaturedArticle({ article, locale }: FeaturedArticleProps) {
  const isEn = locale === 'en';
  const title = isEn && article.title_en ? article.title_en : article.title_id;
  const excerpt = isEn && article.excerpt_en ? article.excerpt_en : article.excerpt_id;
  const category = resolveArticleCategory(article, isEn);
  const prefersReducedMotion = useReducedMotion();

  const dateLabel = new Date(article.published_at || article.created_at).toLocaleDateString(
    isEn ? 'en-US' : 'id-ID',
    { day: 'numeric', month: 'long', year: 'numeric' }
  );

  return (
    <motion.article
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="group rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white overflow-hidden shadow-sm shadow-zinc-200/40 hover:shadow-md hover:border-emerald-700/20 transition-all duration-300"
    >
      <Link
        href={`/${locale}/insights/${article.slug}`}
        className="grid grid-cols-1 md:grid-cols-2 min-h-0"
      >
        <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[280px] bg-emerald-950">
          <Image
            src={article.cover_image_url || '/images/premium_oil_dark.png'}
            alt={title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/40 to-transparent md:hidden" />
        </div>

        <div className="flex flex-col justify-center p-5 sm:p-7 lg:p-8 space-y-3 sm:space-y-4">
          <span className="inline-flex w-fit items-center px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] font-semibold">
            {category.label}
          </span>

          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight leading-snug text-balance group-hover:text-emerald-800 transition-colors">
            {title}
          </h2>

          {excerpt && (
            <p className="text-sm text-zinc-600 leading-relaxed line-clamp-3 text-pretty">
              {excerpt}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 pt-1">
            <time dateTime={article.published_at || article.created_at}>{dateLabel}</time>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {article.read_time_minutes || 5} {isEn ? 'min read' : 'min baca'}
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-emerald-700 group-hover:gap-2.5 transition-all">
            {isEn ? 'Read more' : 'Baca Selengkapnya'}
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
