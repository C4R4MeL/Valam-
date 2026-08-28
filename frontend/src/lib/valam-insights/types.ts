// ============================================================
// Valam Insights — TypeScript Types
// ============================================================

export type ContentType = 'artikel' | 'panduan' | 'cerita_koperasi';
export type ContentStatus = 'draft' | 'published' | 'unpublished';
export type AuthorType = 'admin' | 'koperasi_terverifikasi' | 'kontributor';
export type MarketGrade = 'A' | 'B' | 'C';

// ── Authors ─────────────────────────────────────────────────

export interface InsightAuthor {
  id: string;
  user_id: string | null;
  name: string;
  avatar_url: string | null;
  role_label: string | null;
  supplier_profile_id: string | null;
  bio_id: string | null;
  bio_en: string | null;
  created_at: string;
  updated_at: string;
}

// ── Content ─────────────────────────────────────────────────

export interface InsightContent {
  id: string;
  content_type: ContentType;
  status: ContentStatus;
  slug: string;
  title_id: string;
  title_en: string | null;
  excerpt_id: string | null;
  excerpt_en: string | null;
  body_id: string | null;
  body_en: string | null;
  cover_image_url: string | null;
  author_id: string | null;
  author_type: AuthorType;
  verified_badge: boolean;
  read_time_minutes: number | null;
  read_time_override: boolean;
  view_count: number;
  like_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// Content with joined author
export interface InsightContentWithAuthor extends InsightContent {
  insights_authors: InsightAuthor | null;
  insights_content_tags?: { insights_tags: InsightTag }[];
  insights_content_cta?: InsightCTA[];
  insights_content_images?: InsightContentImage[];
}

// ── Content Images ──────────────────────────────────────────

export interface InsightContentImage {
  id: string;
  content_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

// ── Tags ────────────────────────────────────────────────────

export interface InsightTag {
  id: string;
  name: string;
  slug: string;
}

// ── Content Like ────────────────────────────────────────────

export interface InsightContentLike {
  id: string;
  content_id: string;
  user_id: string;
  created_at: string;
}

// ── Content Comment ─────────────────────────────────────────

export interface InsightContentComment {
  id: string;
  content_id: string;
  user_id: string;
  body: string;
  created_at: string;
  // Joined user info (from a view or manual join)
  user_name?: string;
  user_avatar?: string;
}

// ── Market Prices ───────────────────────────────────────────

export interface InsightMarketPrice {
  id: string;
  grade: MarketGrade;
  price_per_kg: number;
  currency: string;
  updated_by: string | null;
  updated_at: string;
}

export interface InsightMarketPriceHistory {
  id: string;
  grade: MarketGrade;
  price_per_kg: number;
  currency: string;
  recorded_at: string;
}

// ── Content CTA ─────────────────────────────────────────────

export interface InsightCTA {
  id: string;
  content_id: string;
  label_id: string | null;
  label_en: string | null;
  target_url: string;
}

// ── API Request/Response Types ──────────────────────────────

export interface GetContentParams {
  contentType?: ContentType;
  tag?: string;
  language?: 'id' | 'en';
  page?: number;
  pageSize?: number;
}

export interface SearchContentParams {
  query: string;
  language?: 'id' | 'en';
  page?: number;
  pageSize?: number;
}

export interface ContentFormData {
  content_type: ContentType;
  status: ContentStatus;
  slug: string;
  title_id: string;
  title_en?: string;
  excerpt_id?: string;
  excerpt_en?: string;
  body_id?: string;
  body_en?: string;
  cover_image_url?: string;
  author_id?: string;
  author_type: AuthorType;
  verified_badge?: boolean;
  read_time_minutes?: number;
  read_time_override?: boolean;
  tag_ids?: string[];
  cta?: { label_id?: string; label_en?: string; target_url: string }[];
  images?: { image_url: string; caption?: string; sort_order: number }[];
}

// ── Search Result (from RPC) ────────────────────────────────

export interface InsightSearchResult {
  id: string;
  content_type: ContentType;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  author_name: string | null;
  author_avatar: string | null;
  read_time_minutes: number | null;
  view_count: number;
  like_count: number;
  published_at: string | null;
  rank: number;
}

// ── Toggle Like Result (from RPC) ───────────────────────────

export interface ToggleLikeResult {
  liked: boolean;
  like_count: number;
}
