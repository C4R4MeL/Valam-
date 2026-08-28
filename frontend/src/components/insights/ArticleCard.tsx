'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, animate, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, TrendingUp, Users, CheckCircle2 } from 'lucide-react';
import type { InsightContentWithAuthor } from '@/lib/valam-insights/types';
import { cardVariants } from '@/lib/animations';

interface ArticleCardProps {
  article: InsightContentWithAuthor;
  locale: string;
  className?: string;
  imageHeightClass?: string;
}

export function ArticleCard({
  article,
  locale,
  className = '',
  imageHeightClass = 'h-48'
}: ArticleCardProps) {
  const isEn = locale === 'en';
  const title = isEn && article.title_en ? article.title_en : article.title_id;
  const excerpt = isEn && article.excerpt_en ? article.excerpt_en : article.excerpt_id;
  
  const cardRef = useRef<HTMLDivElement>(null);
  const [imageTransform, setImageTransform] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  // Screen size check for mobile disabling
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Parallax Effect
  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile || prefersReducedMotion) return;
    try {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 10;
      setImageTransform({ x, y });
    } catch (err) {
      console.warn('Parallax hover error:', err);
    }
  };

  const handleImageMouseLeave = () => {
    setImageTransform({ x: 0, y: 0 });
  };

  // Magnetic Effect
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile || prefersReducedMotion || !cardRef.current) return;
    try {
      const rect = cardRef.current.getBoundingClientRect();
      const deltaX = (e.clientX - (rect.left + rect.width / 2)) * 0.04;
      const deltaY = (e.clientY - (rect.top + rect.height / 2)) * 0.04;
      animate(cardRef.current, { x: deltaX, y: deltaY }, { duration: 0.3 });
    } catch (err) {
      console.warn('Magnetic effect error:', err);
    }
  };

  const handleCardMouseLeave = () => {
    if (isMobile || !cardRef.current) return;
    try {
      animate(cardRef.current, { x: 0, y: 0 }, { type: 'spring', stiffness: 300, damping: 20 });
    } catch (err) {
      console.warn('Magnetic reset error:', err);
    }
  };

  // Map Category styling & labels
  const categoryConfig: Record<string, { label: string; icon: any; color: string; stripColor: string }> = {
    artikel: {
      label: isEn ? 'Article' : 'Artikel',
      icon: BookOpen,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      stripColor: 'bg-emerald-500',
    },
    panduan: {
      label: isEn ? 'Guide' : 'Panduan',
      icon: TrendingUp,
      color: 'bg-blue-50 text-blue-800 border-blue-200',
      stripColor: 'bg-blue-500',
    },
    cerita_koperasi: {
      label: isEn ? 'Cooperative Story' : 'Cerita Koperasi',
      icon: Users,
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      stripColor: 'bg-amber-500',
    },
  };

  const currentCategory = categoryConfig[article.content_type] || categoryConfig.artikel;
  const CatIcon = currentCategory.icon;

  // Visual reading progress bar builder: 1min = 20% (1 block), 5min = 100% (5 blocks)
  const readTime = article.read_time_minutes || 3;
  const totalBlocks = 7;
  const filledBlocks = Math.min(totalBlocks, Math.max(1, Math.round((readTime / 5) * totalBlocks)));
  const blocksStr = '█'.repeat(filledBlocks) + '░'.repeat(totalBlocks - filledBlocks);

  return (
    <motion.div
      ref={cardRef}
      variants={cardVariants}
      onMouseMove={handleCardMouseMove}
      onMouseLeave={handleCardMouseLeave}
      className={`group bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:border-emerald-600/35 hover:shadow-2xl hover:shadow-emerald-950/[0.04] transition-all duration-300 flex flex-col h-full relative ${className}`}
    >
      <Link href={`/${locale}/insights/${article.slug}`} className="flex flex-col h-full flex-1">

        {/* Top Image Cover block */}
        <div 
          className={`relative ${imageHeightClass} w-full overflow-hidden shrink-0 cursor-pointer`}
          onMouseMove={handleImageMouseMove}
          onMouseLeave={handleImageMouseLeave}
        >
          {/* Parallax Image container */}
          <div 
            className="absolute inset-0 w-full h-full"
            style={
              !isMobile && !prefersReducedMotion
                ? {
                    transform: `translate(${imageTransform.x}px, ${imageTransform.y}px) scale(1.1)`,
                    transition: 'transform 0.1s ease-out',
                  }
                : {}
            }
          >
            <Image
              src={article.cover_image_url || '/images/premium_oil_dark.png'}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 30vw"
            />
          </div>

          {/* Top Overlays */}
          <div className="absolute top-3 left-3 z-10">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border shadow-sm ${currentCategory.color}`}>
              <CatIcon className="w-3 h-3" />
              {currentCategory.label}
            </span>
          </div>

          {article.verified_badge && (
            <div className="absolute top-3 right-3 z-10">
              <span className="inline-flex items-center gap-1 bg-emerald-900/90 text-white font-bold text-[9px] uppercase px-2.5 py-1 rounded-full shadow-sm">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Verified
              </span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div className="space-y-2.5">
            {/* Title */}
            <h3 className="font-semibold text-zinc-950 tracking-tight leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">
              {title}
            </h3>

            {/* Excerpt */}
            {excerpt && (
              <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed font-sans">
                {excerpt}
              </p>
            )}
          </div>

          {/* Reading progress visualizer bar */}
          <div className="pt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between text-[10px] font-mono text-warm-700 bg-zinc-50/50 p-2 rounded-lg border border-zinc-100">
              <span className="text-zinc-600 font-medium">
                📖 <span className="text-emerald-600 font-bold ml-1">{blocksStr}</span>
              </span>
              <span className="font-sans font-semibold text-warm-700 uppercase tracking-wider">
                {readTime} Min {isEn ? 'Read' : 'Baca'}
              </span>
            </div>

            {/* Footer Author metadata */}
            <div className="flex items-center gap-2.5 pt-3 border-t border-zinc-100">
              {article.insights_authors?.avatar_url ? (
                <div className="relative w-6 h-6 rounded-full overflow-hidden border border-zinc-200 shrink-0">
                  <Image
                    src={article.insights_authors.avatar_url}
                    alt={article.insights_authors.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] text-emerald-700 font-bold uppercase shrink-0">
                  {article.insights_authors?.name?.charAt(0) || 'V'}
                </div>
              )}
              
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-zinc-800 truncate leading-none">
                  {article.insights_authors?.name || 'Tim Valam'}
                </p>
                <p className="text-[9px] text-warm-700 mt-1 font-sans leading-none">
                  {new Date(article.published_at || new Date()).toLocaleDateString(
                    locale === 'id' ? 'id-ID' : 'en-US',
                    { day: 'numeric', month: 'short', year: 'numeric' }
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

      </Link>
    </motion.div>
  );
}
