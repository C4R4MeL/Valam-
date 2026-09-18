'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { getPublishedContent, searchContent } from '@/lib/valam-insights/insights-api';
import type { InsightContentWithAuthor, InsightSearchResult } from '@/lib/valam-insights/types';
import { ScrollProgressIndicator } from '@/components/insights/ScrollProgressIndicator';
import { InsightsHero } from '@/components/insights/InsightsHero';
import { MarketOverview } from '@/components/insights/MarketOverview';
import { FeaturedArticle } from '@/components/insights/FeaturedArticle';
import { ArticleGrid } from '@/components/insights/ArticleGrid';
import { InsightsSidebar } from '@/components/insights/InsightsSidebar';
import { ArticleSkeleton } from '@/components/insights/ArticleSkeleton';
import { InsightsCTA } from '@/components/insights/InsightsCTA';
import { FAQSection } from '@/components/landing/FAQSection';
import {
  INSIGHT_CATEGORIES,
  type InsightCategoryId,
  articleMatchesCategory,
} from '@/components/insights/categories';

const MARKET_FEATURE_HINTS = [
  'harga minyak nilam',
  'harga nilam',
  'patchouli oil price',
  'tren dan faktor',
  'price',
];

function pickFeatured(
  articles: InsightContentWithAuthor[]
): InsightContentWithAuthor | null {
  if (!articles.length) return null;
  const marketHit = articles.find((a) => {
    const t = `${a.title_id} ${a.title_en || ''}`.toLowerCase();
    return MARKET_FEATURE_HINTS.some((h) => t.includes(h));
  });
  return marketHit || articles[0];
}

export function InsightsHub() {
  const locale = useLocale();
  const isEn = locale === 'en';
  const searchParams = useSearchParams();

  const [activeCategory, setActiveCategory] = useState<InsightCategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [content, setContent] = useState<InsightContentWithAuthor[]>([]);
  const [searchResults, setSearchResults] = useState<InsightSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [allArticles, setAllArticles] = useState<InsightContentWithAuthor[]>([]);

  // Deep-link: ?focus=harga → Harga & Pasar category
  useEffect(() => {
    const focus = searchParams.get('focus');
    if (focus === 'harga') {
      setActiveCategory('harga-pasar');
    }
  }, [searchParams]);

  useEffect(() => {
    getPublishedContent({ pageSize: 100 })
      .then((res) => setAllArticles(res.data))
      .catch(console.error);
  }, []);

  const fetchContent = useCallback(
    async (targetPage: number, append: boolean) => {
      if (append) setIsLoadingMore(true);
      else setLoading(true);

      try {
        const result = await getPublishedContent({
          language: locale as 'id' | 'en',
          page: targetPage,
          pageSize: 9,
        });
        setContent((prev) => (append ? [...prev, ...result.data] : result.data));
        setTotalPages(result.totalPages);
        setPage(targetPage);
      } catch (err) {
        console.error('Failed to fetch content:', err);
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    },
    [locale]
  );

  useEffect(() => {
    if (!searchQuery) {
      fetchContent(1, false);
      setIsSearching(false);
    }
  }, [fetchContent, searchQuery]);

  useEffect(() => {
    if (!searchQuery.trim()) return;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setLoading(true);
      try {
        const results = await searchContent({
          query: searchQuery,
          language: locale as 'id' | 'en',
          page: 1,
          pageSize: 12,
        });
        setSearchResults(results);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, locale]);

  const handleLoadMore = () => {
    if (page < totalPages && !isLoadingMore && activeCategory === 'all' && !isSearching) {
      fetchContent(page + 1, true);
    }
  };

  const mappedSearchResults: InsightContentWithAuthor[] = searchResults.map((item) => ({
    id: item.id,
    slug: item.slug,
    content_type: item.content_type,
    status: 'published' as const,
    title_id: item.title,
    title_en: item.title,
    excerpt_id: item.excerpt,
    excerpt_en: item.excerpt,
    body_id: '',
    body_en: '',
    cover_image_url: null,
    author_id: null,
    author_type: 'admin' as const,
    verified_badge: false,
    read_time_minutes: item.read_time_minutes,
    read_time_override: false,
    view_count: 0,
    like_count: 0,
    published_at: item.published_at,
    created_at: item.published_at || new Date().toISOString(),
    updated_at: item.published_at || new Date().toISOString(),
    insights_authors: {
      id: '',
      user_id: null,
      name: item.author_name || 'Tim Valam',
      avatar_url: item.author_avatar,
      role_label: null,
      supplier_profile_id: null,
      bio_id: null,
      bio_en: null,
      created_at: '',
      updated_at: '',
    },
  }));

  const baseList = isSearching
    ? mappedSearchResults
    : activeCategory === 'all'
      ? content
      : allArticles.filter((a) => articleMatchesCategory(a, activeCategory));

  const showFeatured =
    !searchQuery && activeCategory === 'all' && !isSearching && baseList.length > 0;

  const featuredArticle = useMemo(
    () => (showFeatured ? pickFeatured(baseList) : null),
    [showFeatured, baseList]
  );

  const displayArticles = featuredArticle
    ? baseList.filter((a) => a.id !== featuredArticle.id)
    : baseList;

  const popularArticles = [...allArticles]
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col font-sans valam-grid-bg selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      <Navbar />
      <ScrollProgressIndicator />

      <main className="flex-1">
        <InsightsHero
          locale={locale}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 space-y-8 sm:space-y-10">
          {/* Prominent price block */}
          <MarketOverview locale={locale} variant="section" />

          {/* Category navigation — horizontal scroll on mobile */}
          {!searchQuery && (
            <nav
              aria-label={isEn ? 'Insight categories' : 'Kategori insight'}
              className="-mx-4 sm:mx-0 px-4 sm:px-0"
            >
              <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory hide-scrollbar">
                {INSIGHT_CATEGORIES.map((cat) => {
                  const active = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setActiveCategory(cat.id);
                        setPage(1);
                      }}
                      className={`snap-start flex-shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                        active
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                          : 'bg-white text-zinc-600 border-zinc-200 hover:border-emerald-600/40 hover:text-emerald-800'
                      }`}
                    >
                      {isEn ? cat.labelEn : cat.labelId}
                    </button>
                  );
                })}
              </div>
            </nav>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            <div className="lg:col-span-8 xl:col-span-9 space-y-8">
              {loading ? (
                <ArticleSkeleton />
              ) : (
                <>
                  {featuredArticle && (
                    <FeaturedArticle article={featuredArticle} locale={locale} />
                  )}

                  <div>
                    <h2 className="text-lg font-bold text-zinc-900 tracking-tight mb-4">
                      {isEn ? 'Latest insights' : 'Artikel Terbaru'}
                    </h2>

                    <AnimatePresence mode="wait">
                      {displayArticles.length > 0 ? (
                        <motion.div
                          key={`${activeCategory}-${searchQuery}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.25 }}
                        >
                          <ArticleGrid
                            articles={displayArticles}
                            locale={locale}
                            onLoadMore={handleLoadMore}
                            hasMore={
                              page < totalPages &&
                              !isSearching &&
                              activeCategory === 'all'
                            }
                            isLoadingMore={isLoadingMore}
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-zinc-200/80 px-6"
                        >
                          <BookOpen className="w-10 h-10 text-zinc-300 mb-4" />
                          <h3 className="text-base font-bold text-zinc-900 mb-2">
                            {isEn
                              ? 'No articles in this category'
                              : 'Belum ada artikel di kategori ini'}
                          </h3>
                          <p className="text-sm text-zinc-500 max-w-sm mb-5">
                            {isEn
                              ? 'Try another category or browse all insights.'
                              : 'Coba kategori lain atau lihat semua insights.'}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveCategory('all');
                              setSearchQuery('');
                              setPage(1);
                            }}
                            className="bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
                          >
                            {isEn ? 'View all articles' : 'Lihat Semua Artikel'}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </div>

            <div className="lg:col-span-4 xl:col-span-3 order-last lg:order-none">
              <InsightsSidebar locale={locale} popularArticles={popularArticles} />
            </div>
          </div>
        </section>

        <InsightsCTA locale={locale} />
        <FAQSection />
      </main>

      <Footer />
    </div>
  );
}

export default InsightsHub;
