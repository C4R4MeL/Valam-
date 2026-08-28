// ============================================================
// Valam Insights — Supabase API Layer
// ============================================================

import { createClient } from '@/lib/supabase/client';
import type {
  GetContentParams,
  SearchContentParams,
  InsightContentWithAuthor,
  InsightTag,
  InsightMarketPrice,
  InsightMarketPriceHistory,
  InsightContentComment,
  InsightSearchResult,
  ToggleLikeResult,
  ContentFormData,
  ContentStatus,
  ContentType,
} from './types';

// ── Singleton Supabase client ───────────────────────────────

function getSupabase() {
  return createClient();
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC READ QUERIES
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch published content with filters and pagination.
 */
export async function getPublishedContent({
  contentType,
  tag,
  language = 'id',
  page = 1,
  pageSize = 9,
}: GetContentParams = {}) {
  const supabase = getSupabase();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('insights_content')
    .select(
      `
      *,
      insights_authors(*),
      insights_content_tags(insights_tags(*))
    `,
      { count: 'exact' }
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(from, to);

  if (contentType) {
    query = query.eq('content_type', contentType);
  }

  if (tag) {
    // Filter by tag slug via inner join
    query = query.eq('insights_content_tags.insights_tags.slug', tag);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: (data || []) as InsightContentWithAuthor[],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

/**
 * Fetch a single content item by slug, with all relations.
 * Also increments the view count via RPC.
 */
export async function getContentBySlug(
  slug: string,
  language: string = 'id'
) {
  const supabase = getSupabase();

  // Increment view count (fire-and-forget)
  supabase.rpc('insights_increment_view_count', { content_slug: slug });

  const { data, error } = await supabase
    .from('insights_content')
    .select(
      `
      *,
      insights_authors(*),
      insights_content_tags(insights_tags(*)),
      insights_content_cta(*),
      insights_content_images(*)
    `
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) throw error;

  return data as InsightContentWithAuthor;
}

/**
 * Fetch related content based on shared tags.
 */
export async function getRelatedContent(
  contentId: string,
  limit: number = 3
) {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc('insights_get_related', {
    p_content_id: contentId,
    p_limit: limit,
  });

  if (error) throw error;
  return data || [];
}

/**
 * Full-text search content via RPC.
 */
export async function searchContent({
  query,
  language = 'id',
  page = 1,
  pageSize = 10,
}: SearchContentParams) {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc('insights_search', {
    query_text: query,
    lang: language,
    lim: pageSize,
    off_set: (page - 1) * pageSize,
  });

  if (error) throw error;
  return (data || []) as InsightSearchResult[];
}

// ═══════════════════════════════════════════════════════════════
// MARKET PRICES
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch the latest market prices for all grades.
 */
export async function getLatestMarketPrices() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('insights_market_prices')
    .select('*')
    .order('grade');

  if (error) throw error;
  return (data || []) as InsightMarketPrice[];
}

/**
 * Fetch price history for a specific grade (for charts).
 */
export async function getMarketPriceHistory(
  grade: string,
  limit: number = 30
) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('insights_market_price_history')
    .select('*')
    .eq('grade', grade)
    .order('recorded_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as InsightMarketPriceHistory[];
}

// ═══════════════════════════════════════════════════════════════
// ENGAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * Toggle like on a content item.
 */
export async function toggleLike(
  contentId: string,
  userId: string
): Promise<ToggleLikeResult> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc('insights_toggle_like', {
    p_content_id: contentId,
    p_user_id: userId,
  });

  if (error) throw error;
  return data as ToggleLikeResult;
}

/**
 * Check if the current user has liked a content item.
 */
export async function checkUserLiked(
  contentId: string,
  userId: string
): Promise<boolean> {
  const supabase = getSupabase();

  const { data } = await supabase
    .from('insights_content_likes')
    .select('id')
    .eq('content_id', contentId)
    .eq('user_id', userId)
    .maybeSingle();

  return !!data;
}

/**
 * Add a comment to a content item.
 */
export async function addComment(
  contentId: string,
  userId: string,
  body: string
) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('insights_content_comments')
    .insert({ content_id: contentId, user_id: userId, body })
    .select()
    .single();

  if (error) throw error;
  return data as InsightContentComment;
}

/**
 * Fetch comments for a content item with pagination.
 */
export async function getComments(
  contentId: string,
  page: number = 1,
  pageSize: number = 20
) {
  const supabase = getSupabase();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('insights_content_comments')
    .select('*', { count: 'exact' })
    .eq('content_id', contentId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data: (data || []) as InsightContentComment[], total: count || 0 };
}

// ═══════════════════════════════════════════════════════════════
// TAGS
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch all tags.
 */
export async function getAllTags() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('insights_tags')
    .select('*')
    .order('name');

  if (error) throw error;
  return (data || []) as InsightTag[];
}

// ═══════════════════════════════════════════════════════════════
// ADMIN OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch all content (admin view, includes draft/unpublished).
 */
export async function getAllContent({
  status,
  contentType,
  page = 1,
  pageSize = 20,
}: {
  status?: ContentStatus;
  contentType?: ContentType;
  page?: number;
  pageSize?: number;
} = {}) {
  const supabase = getSupabase();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('insights_content')
    .select(
      `
      *,
      insights_authors(name, avatar_url),
      insights_content_tags(insights_tags(name, slug))
    `,
      { count: 'exact' }
    )
    .order('updated_at', { ascending: false })
    .range(from, to);

  if (status) {
    query = query.eq('status', status);
  }
  if (contentType) {
    query = query.eq('content_type', contentType);
  }

  const { data, error, count } = await query;

  if (error) throw error;
  return {
    data: (data || []) as InsightContentWithAuthor[],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

/**
 * Create a new content item with tags, CTAs, and images.
 */
export async function createContent(formData: ContentFormData) {
  const supabase = getSupabase();
  const { tag_ids, cta, images, ...contentData } = formData;

  // If publishing, set published_at
  if (contentData.status === 'published' && !contentData.slug) {
    throw new Error('Slug is required for publishing');
  }

  const insertData = {
    ...contentData,
    published_at:
      contentData.status === 'published' ? new Date().toISOString() : null,
  };

  const { data: content, error } = await supabase
    .from('insights_content')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;

  // Insert tags
  if (tag_ids && tag_ids.length > 0) {
    const tagRows = tag_ids.map((tagId) => ({
      content_id: content.id,
      tag_id: tagId,
    }));
    await supabase.from('insights_content_tags').insert(tagRows);
  }

  // Insert CTAs
  if (cta && cta.length > 0) {
    const ctaRows = cta.map((c) => ({
      content_id: content.id,
      ...c,
    }));
    await supabase.from('insights_content_cta').insert(ctaRows);
  }

  // Insert images
  if (images && images.length > 0) {
    const imageRows = images.map((img) => ({
      content_id: content.id,
      ...img,
    }));
    await supabase.from('insights_content_images').insert(imageRows);
  }

  return content;
}

/**
 * Update an existing content item.
 */
export async function updateContent(id: string, formData: ContentFormData) {
  const supabase = getSupabase();
  const { tag_ids, cta, images, ...contentData } = formData;

  // Set published_at when changing to published
  const updateData = {
    ...contentData,
    ...(contentData.status === 'published'
      ? { published_at: new Date().toISOString() }
      : {}),
  };

  const { data: content, error } = await supabase
    .from('insights_content')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Replace tags
  if (tag_ids !== undefined) {
    await supabase
      .from('insights_content_tags')
      .delete()
      .eq('content_id', id);

    if (tag_ids.length > 0) {
      const tagRows = tag_ids.map((tagId) => ({
        content_id: id,
        tag_id: tagId,
      }));
      await supabase.from('insights_content_tags').insert(tagRows);
    }
  }

  // Replace CTAs
  if (cta !== undefined) {
    await supabase.from('insights_content_cta').delete().eq('content_id', id);

    if (cta.length > 0) {
      const ctaRows = cta.map((c) => ({ content_id: id, ...c }));
      await supabase.from('insights_content_cta').insert(ctaRows);
    }
  }

  // Replace images
  if (images !== undefined) {
    await supabase
      .from('insights_content_images')
      .delete()
      .eq('content_id', id);

    if (images.length > 0) {
      const imageRows = images.map((img) => ({ content_id: id, ...img }));
      await supabase.from('insights_content_images').insert(imageRows);
    }
  }

  return content;
}

/**
 * Delete a content item.
 */
export async function deleteContent(id: string) {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('insights_content')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Update a market price entry.
 */
export async function updateMarketPrice(
  id: string,
  price_per_kg: number,
  authorId?: string
) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('insights_market_prices')
    .update({
      price_per_kg,
      updated_by: authorId || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as InsightMarketPrice;
}

/**
 * Upload an image to Supabase Storage (insights-media bucket).
 */
export async function uploadInsightImage(
  file: File,
  path: string
): Promise<string> {
  const supabase = getSupabase();

  const { data, error } = await supabase.storage
    .from('insights-media')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from('insights-media').getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Create or find a tag by name.
 */
export async function findOrCreateTag(
  name: string,
  slug: string
): Promise<InsightTag> {
  const supabase = getSupabase();

  // Try find first
  const { data: existing } = await supabase
    .from('insights_tags')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (existing) return existing as InsightTag;

  // Create new
  const { data, error } = await supabase
    .from('insights_tags')
    .insert({ name, slug })
    .select()
    .single();

  if (error) throw error;
  return data as InsightTag;
}
