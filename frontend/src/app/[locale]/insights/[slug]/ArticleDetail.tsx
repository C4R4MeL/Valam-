'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { motion, useScroll, useReducedMotion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import {
  Clock, Eye, Calendar, ArrowLeft, MessageCircle,
  CheckCircle, Tag, ChevronRight, Link2, Send
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { LikeButton } from '@/components/insights/article/LikeButton';
import { AuthorCard } from '@/components/insights/article/AuthorCard';
import { RelatedArticles } from '@/components/insights/article/RelatedArticles';
import {
  getContentBySlug,
  getRelatedContent,
  toggleLike,
  checkUserLiked,
  addComment,
  getComments,
} from '@/lib/valam-insights/insights-api';
import {
  formatDate,
  getContentTypeLabel,
  getLocalizedField,
} from '@/lib/valam-insights/utils';
import { useAuthContext } from '@/components/providers/AuthProvider';
import type { InsightContentWithAuthor, InsightContentComment } from '@/lib/valam-insights/types';

interface ArticleDetailProps {
  slug: string;
}

interface TocItem {
  text: string;
  id: string;
  level: number;
}

const typeColors: Record<string, string> = {
  artikel: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  panduan: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  cerita_koperasi: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

const parseToc = (mdContent: string): TocItem[] => {
  const lines = mdContent.split('\n');
  const items: TocItem[] = [];
  lines.forEach((line) => {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/[**_*`#]/g, '').trim();
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      items.push({ text, id, level });
    }
  });
  return items;
};

export function ArticleDetail({ slug }: ArticleDetailProps) {
  const locale = useLocale();
  const isEn = locale === 'en';
  const { isAuthenticated } = useAuthContext();
  const prefersReducedMotion = useReducedMotion();

  // Scroll Progress (tracks entire page)
  const { scrollYProgress } = useScroll();

  // State
  const [article, setArticle] = useState<InsightContentWithAuthor | null>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<InsightContentComment[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState('');

  // Fetch article data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getContentBySlug(slug, locale);
        setArticle(data);
        setLikeCount(data.like_count);

        // Fetch related content
        const rel = await getRelatedContent(data.id);
        setRelated(rel.slice(0, 3)); // Ensure max 3 related articles

        // Fetch comments
        const { data: cmts } = await getComments(data.id);
        setComments(cmts);
      } catch (err) {
        console.error('Failed to load article:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, locale]);

  // Check if liked
  useEffect(() => {
    if (!article || !isAuthenticated) return;
    checkUserLiked(article.id, '').then(setLiked).catch(() => {});
  }, [article, isAuthenticated]);

  // Parse Headings for TOC
  const body = article ? getLocalizedField(article, 'body', locale) || '' : '';
  const tocItems = parseToc(body);

  // TOC active section spy
  useEffect(() => {
    if (tocItems.length === 0 || prefersReducedMotion) return;

    const headingElements = tocItems
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeadingId(entry.target.id);
          }
        });
      },
      { rootMargin: '0px 0px -50% 0px', threshold: 0.6 }
    );

    headingElements.forEach((el) => observer.observe(el));
    return () => {
      headingElements.forEach((el) => observer.unobserve(el));
    };
  }, [tocItems, prefersReducedMotion]);

  const handleLike = async () => {
    if (!article || !isAuthenticated) return;
    try {
      const result = await toggleLike(article.id, '');
      setLiked(result.liked);
      setLikeCount(result.like_count);
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  const handleAddComment = async () => {
    if (!article || !commentBody.trim()) return;
    setSubmittingComment(true);
    try {
      const newComment = await addComment(article.id, '', commentBody.trim());
      setComments((prev) => [newComment, ...prev]);
      setCommentBody('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Localized title & excerpt
  const title = article ? getLocalizedField(article, 'title', locale) || '' : '';
  const excerpt = article ? getLocalizedField(article, 'excerpt', locale) || '' : '';

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0a1a0f]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
            <p className="text-xs text-white/50 uppercase tracking-widest font-bold">
              {isEn ? 'Loading Article...' : 'Memuat Artikel...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0a1a0f]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 text-white">
          <h1 className="text-2xl font-serif font-bold">
            {isEn ? 'Article not found' : 'Artikel tidak ditemukan'}
          </h1>
          <Link href="/insights" className="text-amber-500 hover:text-amber-400 text-xs font-bold uppercase tracking-wider">
            ← {isEn ? 'Back to Insights' : 'Kembali ke Insights'}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const author = article.insights_authors;
  const tags = article.insights_content_tags?.map((ct) => ct.insights_tags) || [];

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar />

      {/* Reading Progress Indicator */}
      <motion.div
        style={{ scaleX: scrollYProgress, transformOrigin: 'left' }}
        className="fixed top-0 left-0 right-0 h-[3.5px] bg-emerald-500 z-[99] shadow-sm"
      />

      <main className="flex-1 pb-24">
        
        {/* 1. HERO FOTO - Full Width */}
        {article.cover_image_url && (
          <div className="relative w-full h-[300px] md:h-[520px] overflow-hidden bg-zinc-950">
            <motion.img
              initial={prefersReducedMotion ? {} : { opacity: 0, scale: 1.05 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              src={article.cover_image_url}
              alt={title}
              className="w-full h-full object-cover"
            />
            {/* Bottom shadow gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
          </div>
        )}

        {/* 2. ARTICLE HEADER */}
        <div className="max-w-4xl mx-auto px-6 pt-12 md:pt-16 pb-8 space-y-6">
          
          {/* Breadcrumbs & Kategori */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-zinc-400"
          >
            <Link href="/insights" className="hover:text-emerald-700 transition-colors">
              Insights
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className={`px-3 py-1 rounded-full border ${typeColors[article.content_type] || 'bg-zinc-100 text-zinc-600'}`}>
              {getContentTypeLabel(article.content_type, locale)}
            </span>
          </motion.div>

          {/* Judul Utama */}
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="font-serif text-3xl md:text-5xl font-bold text-zinc-950 leading-tight tracking-tight"
          >
            {title}
          </motion.h1>

          {/* Verified Badge */}
          {article.verified_badge && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 text-emerald-700 bg-emerald-50 w-fit px-3 py-1.5 rounded-lg border border-emerald-100"
            >
              <CheckCircle className="w-4 h-4 fill-emerald-50 text-emerald-700" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {isEn ? 'Verified Content by Valam Quality Team' : 'Konten Terverifikasi Tim Valam'}
              </span>
            </motion.div>
          )}

          {/* Excerpt / Lead Paragraph */}
          {excerpt && (
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="text-lg md:text-xl text-zinc-600 font-normal leading-relaxed border-l-2 border-emerald-600 pl-4"
            >
              {excerpt}
            </motion.p>
          )}

          {/* Meta Bar & Share Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6 border-t border-b border-zinc-200/80 pb-6 text-sm text-zinc-500"
          >
            {/* Left: Author Profile info */}
            {author && (
              <div className="flex items-center gap-3">
                {author.avatar_url ? (
                  <img src={author.avatar_url} alt={author.name} className="w-10 h-10 rounded-full object-cover border border-zinc-200" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-800">
                    {author.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-bold text-zinc-900 leading-none">{author.name}</p>
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wider mt-1">
                    {author.role_label || (isEn ? 'Verified Cooperative' : 'Koperasi Terverifikasi')}
                  </p>
                </div>
              </div>
            )}

            {/* Middle: Details */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-zinc-400">
              {article.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(article.published_at, locale)}
                </span>
              )}
              <span>•</span>
              {article.read_time_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {article.read_time_minutes} Min
                </span>
              )}
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {article.view_count.toLocaleString()} Views
              </span>
            </div>

            {/* Right: Share Buttons */}
            <div className="flex items-center gap-1.5 self-start md:self-center">
              {/* WhatsApp Share */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${title} - ${window.location.href}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Share on WhatsApp"
                className="p-2 rounded-lg bg-zinc-100 hover:bg-primary/10 text-zinc-600 hover:text-primary transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.458L0 24zm6.75-4.228c1.66.986 3.285 1.502 4.903 1.503 5.4 0 9.777-4.374 9.78-9.775.002-2.624-1.025-5.086-2.893-6.957C16.73 2.67 14.27 1.64 11.66 1.64c-5.412 0-9.8 4.387-9.802 9.788-.001 1.882.525 3.434 1.522 4.92l-.994 3.634 3.72-.976z"/>
                </svg>
              </a>

              {/* Twitter/X Share */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Share on Twitter / X"
                className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-950 transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>

              {/* LinkedIn Share */}
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Share on LinkedIn"
                className="p-2 rounded-lg bg-zinc-100 hover:bg-[#e0f2fe]/60 text-zinc-600 hover:text-blue-600 transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>

              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                title="Copy Link"
                className="p-2 rounded-lg bg-zinc-100 hover:bg-primary/10 text-zinc-600 hover:text-primary transition-colors relative"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Link2 className="w-4 h-4" />}
                {copied && (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-950 text-white text-[9px] font-bold py-1 px-2 rounded shadow-lg whitespace-nowrap">
                    {isEn ? 'Copied!' : 'Disalin!'}
                  </span>
                )}
              </button>
            </div>
          </motion.div>

          {/* Tags */}
          {tags.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="flex flex-wrap items-center gap-2 pt-2"
            >
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/insights?tag=${tag.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-colors cursor-pointer"
                >
                  <Tag className="w-3.5 h-3.5" />
                  {tag.name}
                </Link>
              ))}
            </motion.div>
          )}

        </div>

        {/* 3. ARTICLE BODY: Centered layout */}
        <div className="max-w-3xl mx-auto px-6 pt-6 space-y-12">
          
          {/* Premium Typography prose wrapper with drop cap */}
          <article className="article-drop-cap prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-gray-900 prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6 prose-strong:text-gray-900 prose-strong:font-semibold prose-a:text-emerald-700 prose-a:underline hover:prose-a:text-emerald-900 prose-blockquote:border-l-[3px] prose-blockquote:border-emerald-500 prose-blockquote:bg-primary/5 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-ul:space-y-2 prose-li:text-gray-700 prose-img:rounded-2xl prose-img:shadow-lg prose-img:mx-auto">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
              components={{
                h2: ({ children, ...props }) => {
                  const text = Array.isArray(children) ? children.join('') : String(children);
                  const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                  return <h2 id={id} className="scroll-mt-28" {...props}>{children}</h2>;
                },
                h3: ({ children, ...props }) => {
                  const text = Array.isArray(children) ? children.join('') : String(children);
                  const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                  return <h3 id={id} className="scroll-mt-28" {...props}>{children}</h3>;
                },
                blockquote: ({ children }) => {
                  const textContent = String(children).replace(/\[object Object\]/g, '').trim();
                  const isCallout = textContent.includes('💡') || textContent.includes('Tahukah');
                  if (isCallout) {
                    return (
                      <div className="bg-amber-50 border-l-[3px] border-amber-400 rounded-r-xl p-5 my-6 not-prose">
                        <p className="text-amber-900 font-medium text-sm mb-1">💡 Tahukah Anda?</p>
                        <div className="text-amber-800">{children}</div>
                      </div>
                    );
                  }
                  return (
                    <blockquote className="border-l-[3px] border-emerald-500 bg-primary/5 py-4 px-6 rounded-r-xl not-italic">
                      {children}
                    </blockquote>
                  );
                }
              }}
            >
              {body}
            </ReactMarkdown>
          </article>

          {/* 4. ENGAGEMENT BAR (Likes & comments quick summary) */}
          <div className="flex items-center gap-3.5 py-5 border-t border-b border-zinc-200/80">
            <LikeButton
              initialCount={likeCount}
              liked={liked}
              disabled={!isAuthenticated}
              onLike={handleLike}
            />

            <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ml-auto">
              <MessageCircle className="w-4 h-4" />
              {comments.length} {isEn ? 'Comments' : 'Komentar'}
            </div>
          </div>

          {/* 5. AUTHOR CARD - Premium with RFQ button */}
          {author && (
            <AuthorCard author={author} locale={locale} />
          )}

          {/* 6. COMMENTS SECTION */}
          <div className="space-y-6 pt-4">
            <h3 className="font-serif text-xl md:text-2xl font-bold text-zinc-950">
              {isEn ? 'Discussion' : 'Diskusi Komunitas'} ({comments.length})
            </h3>

            {/* Form */}
            {isAuthenticated ? (
              <div className="space-y-3 bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm">
                <textarea
                  id="comment-input"
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder={isEn ? 'Join the discussion...' : 'Bagikan pemikiran Anda tentang wawasan ini...'}
                  rows={3}
                  maxLength={2000}
                  className="w-full p-4 rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 resize-none transition-all"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-400">
                    {commentBody.length} / 2000
                  </span>
                  <button
                    onClick={handleAddComment}
                    disabled={!commentBody.trim() || submittingComment}
                    className="px-5 py-3 rounded-xl bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {submittingComment ? (isEn ? 'Posting...' : 'Mengirim...') : (isEn ? 'Post Comment' : 'Kirim Komentar')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-zinc-100 border border-zinc-200/40 text-center">
                <p className="text-sm text-zinc-500 font-medium">
                  {isEn ? 'Please log in to leave a comment.' : 'Silakan masuk terlebih dahulu untuk mengirim komentar.'}
                </p>
              </div>
            )}

            {/* List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-4 p-5 rounded-2xl bg-white border border-zinc-200/60 shadow-sm hover:border-zinc-300 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-800 shrink-0">
                    {comment.user_name?.charAt(0) || 'U'}
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900">
                        {comment.user_name || (isEn ? 'User' : 'Pengguna')}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {formatDate(comment.created_at, locale)}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600 leading-relaxed font-sans">
                      {comment.body}
                    </p>
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <p className="text-center text-xs font-bold uppercase tracking-widest text-zinc-400 py-10 border border-dashed border-zinc-200 rounded-2xl">
                  {isEn ? 'No comments yet' : 'Belum ada komentar'}
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions (Back to insights hub) */}
          <div className="pt-6 border-t border-zinc-200/80">
            <Link
              href="/insights"
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-600 hover:text-emerald-700 transition-all text-center shadow-sm w-fit mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              {isEn ? 'Back to all Insights' : 'Kembali ke semua Insights'}
            </Link>
          </div>

        </div>

        {/* 7. ARTIKEL TERKAIT - Asymmetric grid */}
        <RelatedArticles articles={related} locale={locale} />

      </main>

      <Footer />
    </div>
  );
}
export default ArticleDetail;
