'use client';

import { motion } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { Clock } from 'lucide-react';
import { formatDate, getContentTypeLabel } from '@/lib/valam-insights/utils';

interface RelatedArticle {
  id: string;
  slug: string;
  content_type: string;
  title_id: string;
  title_en?: string | null;
  excerpt_id?: string | null;
  excerpt_en?: string | null;
  cover_image_url?: string | null;
  read_time_minutes?: number | null;
  published_at?: string | null;
}

interface RelatedArticlesProps {
  articles: RelatedArticle[];
  locale: string;
}

const categoryBadgeColors: Record<string, string> = {
  artikel: 'bg-emerald-500 text-white',
  panduan: 'bg-blue-500 text-white',
  cerita_koperasi: 'bg-amber-400 text-amber-900',
};

const categoryTextColors: Record<string, string> = {
  artikel: 'text-emerald-600',
  panduan: 'text-blue-600',
  cerita_koperasi: 'text-amber-600',
};

export function RelatedArticles({ articles, locale }: RelatedArticlesProps) {
  if (!articles || articles.length === 0) return null;

  const isEn = locale === 'en';
  const [featured, ...rest] = articles.slice(0, 3);

  const getTitle = (a: RelatedArticle) =>
    isEn && a.title_en ? a.title_en : a.title_id;

  return (
    <section className="max-w-5xl mx-auto px-6 mt-16 pt-10 border-t border-gray-100">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-2xl font-serif font-bold text-gray-900 whitespace-nowrap">
          {isEn ? 'Read Also' : 'Baca Juga'}
        </h2>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      {/* Asymmetric grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.1 } },
        }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
      >
        {/* Featured card (left, full height) */}
        {featured && (
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
              },
            }}
            className="md:row-span-2"
          >
            <Link
              href={`/insights/${featured.slug}`}
              className="group relative overflow-hidden rounded-2xl min-h-[300px] md:min-h-[400px] block h-full"
            >
              {/* Cover photo */}
              {featured.cover_image_url ? (
                <img
                  src={featured.cover_image_url}
                  alt={getTitle(featured)}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-emerald-800 to-emerald-950" />
              )}
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <span
                  className={`inline-block text-xs font-semibold px-2 py-1 rounded-full mb-3 ${
                    categoryBadgeColors[featured.content_type] || 'bg-zinc-500 text-white'
                  }`}
                >
                  {getContentTypeLabel(featured.content_type, locale)}
                </span>
                <h3 className="font-serif font-bold text-white text-xl leading-snug line-clamp-3 group-hover:text-emerald-200 transition-colors">
                  {getTitle(featured)}
                </h3>
                <p className="text-white/60 text-sm mt-2">
                  {featured.read_time_minutes || 3} min {isEn ? 'read' : 'baca'}
                  {featured.published_at && ` · ${formatDate(featured.published_at, locale)}`}
                </p>
              </div>
            </Link>
          </motion.div>
        )}

        {/* 2 smaller cards (right, stacked) */}
        {rest.map((article) => (
          <motion.div
            key={article.id}
            variants={{
              hidden: { opacity: 0, x: 20 },
              visible: {
                opacity: 1,
                x: 0,
                transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
              },
            }}
          >
            <Link
              href={`/insights/${article.slug}`}
              className="group flex gap-4 bg-white border border-gray-100 hover:border-emerald-200 hover:shadow-md rounded-2xl p-4 transition-all duration-200 h-full"
            >
              {/* Thumbnail */}
              <div className="relative flex-shrink-0 w-24 h-24 overflow-hidden rounded-xl">
                {article.cover_image_url ? (
                  <img
                    src={article.cover_image_url}
                    alt={getTitle(article)}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                    <span className="text-2xl">📄</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <span
                  className={`text-xs font-medium ${
                    categoryTextColors[article.content_type] || 'text-zinc-600'
                  }`}
                >
                  {getContentTypeLabel(article.content_type, locale)}
                </span>
                <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mt-1 group-hover:text-emerald-700 transition-colors">
                  {getTitle(article)}
                </h3>
                <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {article.read_time_minutes || 3} min
                  {article.published_at && ` · ${formatDate(article.published_at, locale)}`}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

export default RelatedArticles;
