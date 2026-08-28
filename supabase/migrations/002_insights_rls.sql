-- ============================================================
-- Valam Insights — Row Level Security Policies
-- ============================================================

-- Enable RLS on all insights tables
ALTER TABLE insights_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights_content_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights_content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights_content_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights_content_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights_market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights_market_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights_content_cta ENABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════
-- Helper: check if current user is admin
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION insights_is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND r.name = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- Helper: check if current user is a verified supplier/koperasi
CREATE OR REPLACE FUNCTION insights_is_verified_supplier()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM supplier_profiles sp
    JOIN users u ON sp.user_id = u.id
    WHERE u.id = auth.uid()
    AND sp.status IN ('TERVERIFIKASI', 'LEGACY_VERIFIED')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- Helper: get the author_id for the current user
CREATE OR REPLACE FUNCTION insights_get_author_id()
RETURNS uuid AS $$
DECLARE
  aid uuid;
BEGIN
  SELECT id INTO aid FROM insights_authors WHERE user_id = auth.uid() LIMIT 1;
  RETURN aid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ═══════════════════════════════════════════════════════════════
-- insights_authors
-- ═══════════════════════════════════════════════════════════════

-- Anyone can read authors
CREATE POLICY "authors_select_public"
  ON insights_authors FOR SELECT
  USING (true);

-- Only admin can insert new authors
CREATE POLICY "authors_insert_admin"
  ON insights_authors FOR INSERT
  WITH CHECK (insights_is_admin());

-- Admin can update any author; author can update own profile
CREATE POLICY "authors_update"
  ON insights_authors FOR UPDATE
  USING (
    insights_is_admin()
    OR user_id = auth.uid()
  );

-- Only admin can delete authors
CREATE POLICY "authors_delete_admin"
  ON insights_authors FOR DELETE
  USING (insights_is_admin());


-- ═══════════════════════════════════════════════════════════════
-- insights_content
-- ═══════════════════════════════════════════════════════════════

-- Public can only see published content; admin can see all
CREATE POLICY "content_select"
  ON insights_content FOR SELECT
  USING (
    status = 'published'
    OR insights_is_admin()
    OR (
      author_id = insights_get_author_id()
      AND author_type = 'koperasi_terverifikasi'
    )
  );

-- Admin and verified koperasi can create content
CREATE POLICY "content_insert"
  ON insights_content FOR INSERT
  WITH CHECK (
    insights_is_admin()
    OR (
      insights_is_verified_supplier()
      AND author_type = 'koperasi_terverifikasi'
      AND author_id = insights_get_author_id()
    )
  );

-- Admin can update any; koperasi can update own content only
CREATE POLICY "content_update"
  ON insights_content FOR UPDATE
  USING (
    insights_is_admin()
    OR (
      insights_is_verified_supplier()
      AND author_type = 'koperasi_terverifikasi'
      AND author_id = insights_get_author_id()
    )
  );

-- Only admin can delete
CREATE POLICY "content_delete"
  ON insights_content FOR DELETE
  USING (insights_is_admin());


-- ═══════════════════════════════════════════════════════════════
-- insights_content_images
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "content_images_select_public"
  ON insights_content_images FOR SELECT
  USING (true);

CREATE POLICY "content_images_insert"
  ON insights_content_images FOR INSERT
  WITH CHECK (
    insights_is_admin()
    OR insights_is_verified_supplier()
  );

CREATE POLICY "content_images_update"
  ON insights_content_images FOR UPDATE
  USING (insights_is_admin() OR insights_is_verified_supplier());

CREATE POLICY "content_images_delete"
  ON insights_content_images FOR DELETE
  USING (insights_is_admin());


-- ═══════════════════════════════════════════════════════════════
-- insights_tags
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "tags_select_public"
  ON insights_tags FOR SELECT
  USING (true);

CREATE POLICY "tags_insert_admin"
  ON insights_tags FOR INSERT
  WITH CHECK (insights_is_admin());

CREATE POLICY "tags_update_admin"
  ON insights_tags FOR UPDATE
  USING (insights_is_admin());

CREATE POLICY "tags_delete_admin"
  ON insights_tags FOR DELETE
  USING (insights_is_admin());


-- ═══════════════════════════════════════════════════════════════
-- insights_content_tags
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "content_tags_select_public"
  ON insights_content_tags FOR SELECT
  USING (true);

CREATE POLICY "content_tags_insert"
  ON insights_content_tags FOR INSERT
  WITH CHECK (insights_is_admin() OR insights_is_verified_supplier());

CREATE POLICY "content_tags_delete"
  ON insights_content_tags FOR DELETE
  USING (insights_is_admin());


-- ═══════════════════════════════════════════════════════════════
-- insights_content_likes
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "likes_select_public"
  ON insights_content_likes FOR SELECT
  USING (true);

-- Any authenticated user can like
CREATE POLICY "likes_insert_authenticated"
  ON insights_content_likes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Users can remove their own likes
CREATE POLICY "likes_delete_own"
  ON insights_content_likes FOR DELETE
  USING (user_id = auth.uid());


-- ═══════════════════════════════════════════════════════════════
-- insights_content_comments
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "comments_select_public"
  ON insights_content_comments FOR SELECT
  USING (true);

-- Only verified buyers/suppliers can comment
-- Verified = user exists in users table with status != 'pending'
-- and either is admin, or has a verified supplier profile, 
-- or is a buyer with active status
CREATE POLICY "comments_insert_verified"
  ON insights_content_comments FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND (
      insights_is_admin()
      OR insights_is_verified_supplier()
      OR EXISTS (
        SELECT 1 FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = auth.uid()
        AND r.name = 'buyer'
        AND u.status = 'active'
      )
    )
  );

-- Admin can delete any comment; users can delete their own
CREATE POLICY "comments_delete"
  ON insights_content_comments FOR DELETE
  USING (
    insights_is_admin()
    OR user_id = auth.uid()
  );


-- ═══════════════════════════════════════════════════════════════
-- insights_market_prices
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "prices_select_public"
  ON insights_market_prices FOR SELECT
  USING (true);

CREATE POLICY "prices_insert_admin"
  ON insights_market_prices FOR INSERT
  WITH CHECK (insights_is_admin());

CREATE POLICY "prices_update_admin"
  ON insights_market_prices FOR UPDATE
  USING (insights_is_admin());

CREATE POLICY "prices_delete_admin"
  ON insights_market_prices FOR DELETE
  USING (insights_is_admin());


-- ═══════════════════════════════════════════════════════════════
-- insights_market_price_history (read-only for all, auto-inserted by trigger)
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "price_history_select_public"
  ON insights_market_price_history FOR SELECT
  USING (true);


-- ═══════════════════════════════════════════════════════════════
-- insights_content_cta
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "cta_select_public"
  ON insights_content_cta FOR SELECT
  USING (true);

CREATE POLICY "cta_insert"
  ON insights_content_cta FOR INSERT
  WITH CHECK (insights_is_admin() OR insights_is_verified_supplier());

CREATE POLICY "cta_update"
  ON insights_content_cta FOR UPDATE
  USING (insights_is_admin() OR insights_is_verified_supplier());

CREATE POLICY "cta_delete"
  ON insights_content_cta FOR DELETE
  USING (insights_is_admin());
