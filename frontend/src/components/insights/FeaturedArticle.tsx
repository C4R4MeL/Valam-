'use client';

import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen, Clock, Calendar } from 'lucide-react';
import type { InsightContentWithAuthor } from '@/lib/valam-insights/types';

interface FeaturedArticleProps {
  article: InsightContentWithAuthor;
  locale: string;
}

function ScrambledText({ text }: { text: string }) {
  const [displayText, setDisplayText] = useState('');
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayText(text);
      return;
    }
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let currentIteration = 0;
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (index < currentIteration) {
              return text[index];
            }
            if (char === ' ') return ' ';
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );
      currentIteration += 0.8;
      if (currentIteration >= text.length + 2) {
        clearInterval(interval);
        setDisplayText(text);
      }
    }, 20);
    return () => clearInterval(interval);
  }, [text, prefersReducedMotion]);

  return <>{displayText}</>;
}

export function FeaturedArticle({ article, locale }: FeaturedArticleProps) {
  const isEn = locale === 'en';
  const title = isEn && article.title_en ? article.title_en : article.title_id;
  const excerpt = isEn && article.excerpt_en ? article.excerpt_en : article.excerpt_id;
  const [isHovered, setIsHovered] = useState(false);

  // Map category styles
  const categoryLabels: Record<string, string> = {
    artikel: isEn ? 'Article' : 'Artikel',
    panduan: isEn ? 'Guide' : 'Panduan',
    cerita_koperasi: isEn ? 'Cooperative Story' : 'Cerita Koperasi',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full h-[420px] rounded-3xl overflow-hidden shadow-2xl border border-zinc-200/50 bg-[#0a1a0f] cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/${locale}/insights/${article.slug}`}>
        <div className="relative w-full h-full">
          
          {/* Cover Image with 6s zoom transition on hover */}
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <Image
              src={article.cover_image_url || '/images/premium_oil_dark.png'}
              alt={title}
              fill
              priority
              sizes="100vw"
              className="object-cover transition-transform ease-in-out scale-100 group-hover:scale-105"
              style={{ transitionDuration: '6000ms' }}
            />
          </div>

          {/* Bottom-to-Top Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {/* Badges - Top Left */}
          <div className="absolute top-6 left-6 z-20 flex gap-2">
            <span className="bg-emerald-600 text-white font-bold text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              {categoryLabels[article.content_type] || article.content_type}
            </span>
            <span className="bg-amber-500 text-white font-bold text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full shadow-sm">
              ✓ {isEn ? 'Editor\'s Choice' : 'Artikel Pilihan'}
            </span>
          </div>

          {/* Content Overlays - Bottom Left */}
          <div className="absolute bottom-6 left-6 right-6 z-20 text-white flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            
            <div className="max-w-2xl space-y-3">
              {/* Animated Scramble Title */}
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight max-w-xl">
                <ScrambledText text={title} />
              </h2>
              
              {/* Excerpt */}
              {excerpt && (
                <p className="text-sm text-white/70 line-clamp-2 leading-relaxed font-sans max-w-lg">
                  {excerpt}
                </p>
              )}

              {/* Author Meta */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-white/60">
                {article.insights_authors?.avatar_url && (
                  <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/20">
                    <Image
                      src={article.insights_authors.avatar_url}
                      alt={article.insights_authors.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <span className="font-medium text-white/90">
                  {article.insights_authors?.name || 'Tim Valam'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {article.read_time_minutes} Min
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(article.published_at).toLocaleDateString(
                    locale === 'id' ? 'id-ID' : 'en-US',
                    { day: 'numeric', month: 'short', year: 'numeric' }
                  )}
                </span>
              </div>
            </div>

            {/* Read Button - Emerald pill slides x: -10 to 0 on hover */}
            <motion.div
              animate={{ x: isHovered ? 0 : -10, opacity: isHovered ? 1 : 0.8 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-full shadow-lg flex items-center gap-2 shrink-0 w-fit"
            >
              <span>{isEn ? 'Read More' : 'Baca Selengkapnya'}</span>
              <ArrowRight className="w-4 h-4" />
            </motion.div>

          </div>

        </div>
      </Link>
    </motion.div>
  );
}
