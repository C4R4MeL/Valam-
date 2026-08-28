'use client';

import { Link } from '@/i18n/routing';
import { Clock, Eye, CheckCircle } from 'lucide-react';
import { formatDate, getContentTypeLabel } from '@/lib/valam-insights/utils';
import type { ContentType } from '@/lib/valam-insights/types';

interface ContentCardProps {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  contentType: ContentType;
  authorName: string;
  authorAvatar: string | null;
  readTime: number | null;
  publishedAt: string | null;
  verifiedBadge?: boolean;
  locale: string;
}

const typeColors: Record<string, string> = {
  artikel: 'bg-blue-100 text-blue-700',
  panduan: 'bg-amber-100 text-amber-700',
  cerita_koperasi: 'bg-emerald-100 text-emerald-700',
};

export function ContentCard({
  slug,
  title,
  excerpt,
  coverImage,
  contentType,
  authorName,
  authorAvatar,
  readTime,
  publishedAt,
  verifiedBadge,
  locale,
}: ContentCardProps) {
  return (
    <Link href={`/insights/${slug}`}>
      <article className="group relative rounded-2xl bg-white border border-zinc-200/60 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-zinc-900/5 hover:-translate-y-1 hover:border-emerald-200/60 h-full flex flex-col">
        {/* Cover Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100">
          {coverImage ? (
            <img
              src={coverImage}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100">
              <div className="w-12 h-12 rounded-xl bg-emerald-200/60 flex items-center justify-center">
                <span className="text-2xl">📄</span>
              </div>
            </div>
          )}

          {/* Content Type Badge */}
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${typeColors[contentType] || 'bg-zinc-100 text-zinc-600'}`}>
              {getContentTypeLabel(contentType, locale)}
            </span>
          </div>

          {/* Verified Badge */}
          {verifiedBadge && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold">
                <CheckCircle className="w-3 h-3" />
                Verified
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-5 flex flex-col">
          <h3 className="text-base font-bold text-zinc-900 mb-2 line-clamp-2 group-hover:text-emerald-800 transition-colors leading-snug">
            {title}
          </h3>

          <p className="text-sm text-zinc-500 line-clamp-2 mb-4 flex-1 leading-relaxed">
            {excerpt}
          </p>

          {/* Meta Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
            <div className="flex items-center gap-2">
              {authorAvatar ? (
                <img
                  src={authorAvatar}
                  alt={authorName}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                  {authorName?.charAt(0) || 'V'}
                </div>
              )}
              <span className="text-xs font-medium text-zinc-600 truncate max-w-[100px]">
                {authorName || 'Tim Valam'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-warm-700">
              {readTime && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {readTime} min
                </span>
              )}
              {publishedAt && (
                <span>{formatDate(publishedAt, locale)}</span>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
