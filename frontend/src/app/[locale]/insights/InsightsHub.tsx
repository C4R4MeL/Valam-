'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import { BookOpen, Filter } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { getPublishedContent, getAllTags, searchContent } from '@/lib/valam-insights/insights-api';
import type { ContentType, InsightContentWithAuthor, InsightTag, InsightSearchResult } from '@/lib/valam-insights/types';

// Redesigned components
import { ScrollProgressIndicator } from '@/components/insights/ScrollProgressIndicator';
import { InsightsHero } from '@/components/insights/InsightsHero';
import { FeaturedArticle } from '@/components/insights/FeaturedArticle';
import { ArticleGrid } from '@/components/insights/ArticleGrid';
import { InsightsSidebar } from '@/components/insights/InsightsSidebar';
import { ArticleSkeleton } from '@/components/insights/ArticleSkeleton';

export function InsightsHub() {
  const locale = useLocale();
  const isEn = locale === 'en';

  // State
  const [activeTab, setActiveTab] = useState<ContentType | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [content, setContent] = useState<InsightContentWithAuthor[]>([]);
  const [searchResults, setSearchResults] = useState<InsightSearchResult[]>([]);
  const [tags, setTags] = useState<InsightTag[]>([]);
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSearching, setIsSearching] = useState(false);

  // Stats State (calculated dynamically or loaded at mount)
  const [stats, setStats] = useState({
    articles: 2,
    guides: 2,
    stories: 2,
    weeks: 52,
    countries: 18
  });
  const [allArticles, setAllArticles] = useState<InsightContentWithAuthor[]>([]);

  // Fetch tag counts and global stats at mount
  useEffect(() => {
    getAllTags().then(setTags).catch(console.error);

    getPublishedContent({ pageSize: 100 })
      .then((res) => {
        setAllArticles(res.data);
        
        // Count tag occurrences
        const counts: Record<string, number> = {};
        res.data.forEach((item) => {
          item.insights_content_tags?.forEach((ct) => {
            const slug = ct.insights_tags?.slug;
            if (slug) {
              counts[slug] = (counts[slug] || 0) + 1;
            }
          });
        });
        setTagCounts(counts);

        // Update stats counters
        setStats({
          articles: res.data.filter((a) => a.content_type === 'artikel').length,
          guides: res.data.filter((a) => a.content_type === 'panduan').length,
          stories: res.data.filter((a) => a.content_type === 'cerita_koperasi').length,
          weeks: 52,
          countries: 18
        });
      })
      .catch(console.error);
  }, []);

  // Fetch content dynamically based on target page and append state
  const fetchContent = useCallback(async (targetPage: number, append: boolean) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const result = await getPublishedContent({
        contentType: activeTab || undefined,
        tag: activeTag || undefined,
        language: locale as 'id' | 'en',
        page: targetPage,
        pageSize: 9,
      });

      setContent((prev) => append ? [...prev, ...result.data] : result.data);
      setTotalPages(result.totalPages);
      setPage(targetPage);
    } catch (err) {
      console.error('Failed to fetch content:', err);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [activeTab, activeTag, locale]);

  // Initial fetch triggers when filters change
  useEffect(() => {
    if (!searchQuery) {
      fetchContent(1, false);
      setIsSearching(false);
    }
  }, [fetchContent, searchQuery]);

  // Search with debounce
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

  // Load more function for infinite scroll sentinel
  const handleLoadMore = () => {
    if (page < totalPages && !isLoadingMore) {
      fetchContent(page + 1, true);
    }
  };

  // Map search results flat structures to Content Cards structure
  const mappedSearchResults = searchResults.map((item) => ({
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
    created_at: item.published_at,
    updated_at: item.published_at,
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
      updated_at: ''
    }
  }));

  // Identify featured hero card (only if not searching and no active filters)
  const featuredArticle = !searchQuery && !activeTab && !activeTag ? content[0] : null;
  const displayArticles = featuredArticle ? content.slice(1) : (isSearching ? mappedSearchResults : content);
  const popularArticles = [...allArticles].sort((a, b) => b.view_count - a.view_count).slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-zinc-50 selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar />

      {/* Floating Scroll Indicator on the right */}
      <ScrollProgressIndicator />

      <main className="flex-1">
        {/* HERO SECTION */}
        <InsightsHero
          locale={locale}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setPage={setPage}
          stats={stats}
        />

        {/* CONTENT AREA */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          
          {/* Tag Filter Chips with Count Badges */}
          {tags.length > 0 && !searchQuery && (
            <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-3 scrollbar-hide border-b border-zinc-200/60">
              <div className="flex items-center gap-2 text-zinc-400 font-bold text-xs uppercase tracking-wider shrink-0 mr-2">
                <Filter className="w-4 h-4" />
                <span>Filter Tag:</span>
              </div>
              <button
                onClick={() => { setActiveTag(null); setPage(1); }}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  !activeTag
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-md scale-[1.03]'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-emerald-400'
                }`}
              >
                {isEn ? 'All Tags' : 'Semua Tag'} ({allArticles.length})
              </button>
              {tags.map((tag) => {
                const count = tagCounts[tag.slug] || 0;
                return (
                  <button
                    key={tag.id}
                    onClick={() => { setActiveTag(tag.slug); setPage(1); }}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      activeTag === tag.slug
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-md scale-[1.03]'
                        : 'bg-white text-zinc-600 border-zinc-200 hover:border-emerald-400'
                    }`}
                  >
                    {tag.name} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Main Content Layout: Content Grid (Left) + Sidebar (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
            
            {/* Left Column: Articles Bento Grid */}
            <div className="lg:col-span-3 space-y-12">
              {loading ? (
                <ArticleSkeleton />
              ) : (
                <>
                  {/* Featured Hero Card (Full Width) */}
                  {featuredArticle && (
                    <FeaturedArticle article={featuredArticle} locale={locale} />
                  )}

                  {/* Asymmetric Bento Grid Wrap with Tag Transition AnimatePresence */}
                  <AnimatePresence mode="wait">
                    {displayArticles.length > 0 ? (
                      <motion.div
                        key={`${activeTab}-${activeTag}-${searchQuery}`}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ArticleGrid
                          articles={displayArticles}
                          locale={locale}
                          onLoadMore={handleLoadMore}
                          hasMore={page < totalPages && !isSearching}
                          isLoadingMore={isLoadingMore}
                        />
                      </motion.div>
                    ) : (
                      // Empty State
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-zinc-200/80 p-8 shadow-sm"
                      >
                        {/* SVG Illustration (book & patchouli plant) */}
                        <svg className="w-32 h-32 text-zinc-300 mb-6" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="25" y="45" width="70" height="50" rx="4" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2"/>
                          <line x1="35" y1="58" x2="85" y2="58" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <line x1="35" y1="70" x2="75" y2="70" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <line x1="35" y1="82" x2="65" y2="82" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          {/* Leaves sketch */}
                          <path d="M60 40C60 25 72 20 72 20C72 20 65 30 60 40Z" fill="#10B981" fillOpacity="0.4" stroke="#10B981" strokeWidth="1.5"/>
                          <path d="M60 40C60 25 48 20 48 20C48 20 55 30 60 40Z" fill="#059669" fillOpacity="0.3" stroke="#059669" strokeWidth="1.5"/>
                        </svg>
                        
                        <h3 className="text-lg font-bold text-zinc-900 mb-2">
                          {isEn ? 'No Content Found' : 'Belum ada konten untuk kategori ini'}
                        </h3>
                        <p className="text-xs text-zinc-500 max-w-sm mb-6 leading-relaxed">
                          {isEn
                            ? 'Try clearing your active tags or categories to browse all of our publications.'
                            : 'Coba bersihkan filter pencarian atau tag aktif untuk melihat semua artikel.'}
                        </p>
                        <button
                          onClick={() => {
                            setActiveTab(null);
                            setActiveTag(null);
                            setSearchQuery('');
                            setPage(1);
                          }}
                          className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-800/10 transition-all flex items-center gap-2"
                        >
                          <BookOpen className="w-4 h-4" />
                          {isEn ? 'View All Articles' : 'Lihat Semua Artikel'}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            {/* Right Column: Sticky Sidebar */}
            <div className="lg:col-span-1">
              <InsightsSidebar locale={locale} popularArticles={popularArticles} />
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
export default InsightsHub;
