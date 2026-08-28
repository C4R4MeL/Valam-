-- ============================================================
-- Valam Insights — RPC Functions
-- ============================================================

-- ═══════════════════════════════════════════════════════════════
-- 1. Increment view count (atomic, safe from abuse)
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION insights_increment_view_count(content_slug text)
RETURNS void AS $$
BEGIN
  UPDATE insights_content
  SET view_count = view_count + 1
  WHERE slug = content_slug
  AND status = 'published';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════════
-- 2. Toggle like (insert or delete + update like_count)
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION insights_toggle_like(
  p_content_id uuid,
  p_user_id uuid
)
RETURNS json AS $$
DECLARE
  existing_like uuid;
  new_count int;
BEGIN
  -- Check if already liked
  SELECT id INTO existing_like
  FROM insights_content_likes
  WHERE content_id = p_content_id AND user_id = p_user_id;

  IF existing_like IS NOT NULL THEN
    -- Unlike: remove the like
    DELETE FROM insights_content_likes WHERE id = existing_like;
    
    UPDATE insights_content
    SET like_count = GREATEST(0, like_count - 1)
    WHERE id = p_content_id
    RETURNING like_count INTO new_count;

    RETURN json_build_object('liked', false, 'like_count', new_count);
  ELSE
    -- Like: add the like
    INSERT INTO insights_content_likes (content_id, user_id)
    VALUES (p_content_id, p_user_id);

    UPDATE insights_content
    SET like_count = like_count + 1
    WHERE id = p_content_id
    RETURNING like_count INTO new_count;

    RETURN json_build_object('liked', true, 'like_count', new_count);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════════
-- 3. Full-text search with ranking
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION insights_search(
  query_text text,
  lang text DEFAULT 'id',
  lim int DEFAULT 10,
  off_set int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  content_type insights_content_type,
  slug text,
  title text,
  excerpt text,
  cover_image_url text,
  author_name text,
  author_avatar text,
  read_time_minutes int,
  view_count int,
  like_count int,
  published_at timestamptz,
  rank real
) AS $$
DECLARE
  ts_query tsquery;
BEGIN
  -- Build tsquery based on language
  IF lang = 'en' THEN
    ts_query := websearch_to_tsquery('english', query_text);
  ELSE
    ts_query := websearch_to_tsquery('indonesian', query_text);
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.content_type,
    c.slug,
    CASE WHEN lang = 'en' AND c.title_en IS NOT NULL THEN c.title_en ELSE c.title_id END AS title,
    CASE WHEN lang = 'en' AND c.excerpt_en IS NOT NULL THEN c.excerpt_en ELSE c.excerpt_id END AS excerpt,
    c.cover_image_url,
    a.name AS author_name,
    a.avatar_url AS author_avatar,
    c.read_time_minutes,
    c.view_count,
    c.like_count,
    c.published_at,
    ts_rank_cd(c.search_vector, ts_query) AS rank
  FROM insights_content c
  LEFT JOIN insights_authors a ON c.author_id = a.id
  WHERE c.status = 'published'
    AND c.search_vector @@ ts_query
  ORDER BY rank DESC, c.published_at DESC
  LIMIT lim
  OFFSET off_set;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════════
-- 4. Get related content by shared tags
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION insights_get_related(
  p_content_id uuid,
  p_limit int DEFAULT 3
)
RETURNS TABLE (
  id uuid,
  slug text,
  title_id text,
  title_en text,
  excerpt_id text,
  cover_image_url text,
  content_type insights_content_type,
  read_time_minutes int,
  published_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    c.id,
    c.slug,
    c.title_id,
    c.title_en,
    c.excerpt_id,
    c.cover_image_url,
    c.content_type,
    c.read_time_minutes,
    c.published_at
  FROM insights_content c
  JOIN insights_content_tags ct ON c.id = ct.content_id
  WHERE ct.tag_id IN (
    SELECT tag_id FROM insights_content_tags WHERE content_id = p_content_id
  )
  AND c.id != p_content_id
  AND c.status = 'published'
  ORDER BY c.published_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
