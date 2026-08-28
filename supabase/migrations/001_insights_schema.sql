-- ============================================================
-- Valam Insights — Database Schema Migration
-- ============================================================
-- Prefix: insights_ to avoid conflicts with existing tables
-- Project: gmgcppukzsssptixmlce
-- ============================================================

-- ── Custom Enum Types ───────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE insights_content_type AS ENUM ('artikel', 'panduan', 'cerita_koperasi');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE insights_content_status AS ENUM ('draft', 'published', 'unpublished');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE insights_author_type AS ENUM ('admin', 'koperasi_terverifikasi', 'kontributor');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE insights_market_grade AS ENUM ('A', 'B', 'C');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── 1. Authors ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS insights_authors (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name           text NOT NULL,
  avatar_url     text,
  role_label     text,                -- e.g. "Tim Valam", "Koperasi Meulaboh"
  supplier_profile_id uuid,           -- references supplier_profiles(id) if koperasi
  bio_id         text,                -- bio in Indonesian
  bio_en         text,                -- bio in English
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE insights_authors IS 'Author profiles for Valam Insights content';
COMMENT ON COLUMN insights_authors.supplier_profile_id IS 'Links to supplier_profiles for koperasi authors';
COMMENT ON COLUMN insights_authors.user_id IS 'Links to auth.users for RLS policy matching';


-- ── 2. Content (main table) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS insights_content (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type       insights_content_type NOT NULL,
  status             insights_content_status NOT NULL DEFAULT 'draft',
  slug               text UNIQUE NOT NULL
                       CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  
  -- Bilingual content
  title_id           text NOT NULL,
  title_en           text,
  excerpt_id         text,
  excerpt_en         text,
  body_id            text,                -- markdown
  body_en            text,                -- markdown
  
  -- Media
  cover_image_url    text,
  
  -- Author
  author_id          uuid REFERENCES insights_authors(id) ON DELETE SET NULL,
  author_type        insights_author_type NOT NULL DEFAULT 'admin',
  verified_badge     boolean NOT NULL DEFAULT false,
  
  -- Metrics
  read_time_minutes  int,
  read_time_override boolean NOT NULL DEFAULT false,  -- true = admin manually set read_time
  view_count         int NOT NULL DEFAULT 0,
  like_count         int NOT NULL DEFAULT 0,
  
  -- Timestamps
  published_at       timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  -- Full-text search vector (auto-generated)
  search_vector      tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('indonesian', coalesce(title_id, '')), 'A') ||
    setweight(to_tsvector('english',    coalesce(title_en, '')), 'A') ||
    setweight(to_tsvector('indonesian', coalesce(excerpt_id, '')), 'B') ||
    setweight(to_tsvector('english',    coalesce(excerpt_en, '')), 'B') ||
    setweight(to_tsvector('indonesian', coalesce(body_id, '')), 'C') ||
    setweight(to_tsvector('english',    coalesce(body_en, '')), 'C')
  ) STORED
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_insights_content_status ON insights_content(status);
CREATE INDEX IF NOT EXISTS idx_insights_content_type ON insights_content(content_type);
CREATE INDEX IF NOT EXISTS idx_insights_content_slug ON insights_content(slug);
CREATE INDEX IF NOT EXISTS idx_insights_content_published ON insights_content(published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_insights_content_search ON insights_content USING GIN(search_vector);

COMMENT ON TABLE insights_content IS 'Main content table for Valam Insights articles, guides, and koperasi stories';


-- ── 3. Content Images (inline gallery) ──────────────────────

CREATE TABLE IF NOT EXISTS insights_content_images (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id   uuid NOT NULL REFERENCES insights_content(id) ON DELETE CASCADE,
  image_url    text NOT NULL,
  caption      text,
  sort_order   int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_insights_content_images_content ON insights_content_images(content_id);


-- ── 4. Tags ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS insights_tags (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name  text UNIQUE NOT NULL,
  slug  text UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);


-- ── 5. Content ↔ Tags (many-to-many) ────────────────────────

CREATE TABLE IF NOT EXISTS insights_content_tags (
  content_id  uuid NOT NULL REFERENCES insights_content(id) ON DELETE CASCADE,
  tag_id      uuid NOT NULL REFERENCES insights_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_insights_content_tags_tag ON insights_content_tags(tag_id);


-- ── 6. Content Likes ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS insights_content_likes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id  uuid NOT NULL REFERENCES insights_content(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_insights_content_likes_content ON insights_content_likes(content_id);


-- ── 7. Content Comments ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS insights_content_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id  uuid NOT NULL REFERENCES insights_content(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body        text NOT NULL CHECK (char_length(body) >= 1 AND char_length(body) <= 2000),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_insights_content_comments_content ON insights_content_comments(content_id);
CREATE INDEX IF NOT EXISTS idx_insights_content_comments_user ON insights_content_comments(user_id);


-- ── 8. Market Prices (live widget) ──────────────────────────

CREATE TABLE IF NOT EXISTS insights_market_prices (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade        insights_market_grade NOT NULL,
  price_per_kg numeric NOT NULL,
  currency     text NOT NULL DEFAULT 'IDR',
  updated_by   uuid REFERENCES insights_authors(id),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (grade)
);

COMMENT ON TABLE insights_market_prices IS 'Current market prices for patchouli oil by grade';


-- ── 9. Market Price History ─────────────────────────────────

CREATE TABLE IF NOT EXISTS insights_market_price_history (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade        insights_market_grade NOT NULL,
  price_per_kg numeric NOT NULL,
  currency     text NOT NULL DEFAULT 'IDR',
  recorded_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_insights_price_history_grade ON insights_market_price_history(grade, recorded_at DESC);

COMMENT ON TABLE insights_market_price_history IS 'Historical market price records for trend charts';


-- ── 10. Content CTA (contextual call-to-action) ────────────

CREATE TABLE IF NOT EXISTS insights_content_cta (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id  uuid NOT NULL REFERENCES insights_content(id) ON DELETE CASCADE,
  label_id    text,
  label_en    text,
  target_url  text NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_insights_content_cta_content ON insights_content_cta(content_id);


-- ── Seed default market prices ──────────────────────────────

INSERT INTO insights_market_prices (grade, price_per_kg, currency)
VALUES
  ('A', 850000, 'IDR'),
  ('B', 700000, 'IDR'),
  ('C', 550000, 'IDR')
ON CONFLICT (grade) DO NOTHING;


-- ── Updated_at trigger function ─────────────────────────────

CREATE OR REPLACE FUNCTION insights_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_insights_content_updated
  BEFORE UPDATE ON insights_content
  FOR EACH ROW
  EXECUTE FUNCTION insights_update_timestamp();

CREATE OR REPLACE TRIGGER trg_insights_authors_updated
  BEFORE UPDATE ON insights_authors
  FOR EACH ROW
  EXECUTE FUNCTION insights_update_timestamp();


-- ── Auto-calculate read_time_minutes trigger ────────────────

CREATE OR REPLACE FUNCTION insights_calc_read_time()
RETURNS TRIGGER AS $$
DECLARE
  word_count int;
BEGIN
  -- Skip if admin manually overrode the read time
  IF NEW.read_time_override = true THEN
    RETURN NEW;
  END IF;

  -- Count words in body (use the longer body between ID and EN)
  word_count := GREATEST(
    array_length(regexp_split_to_array(coalesce(NEW.body_id, ''), '\s+'), 1),
    array_length(regexp_split_to_array(coalesce(NEW.body_en, ''), '\s+'), 1)
  );

  -- 200 words per minute, minimum 1 minute
  NEW.read_time_minutes := GREATEST(1, ceil(word_count::numeric / 200));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_insights_content_read_time
  BEFORE INSERT OR UPDATE OF body_id, body_en, read_time_override ON insights_content
  FOR EACH ROW
  EXECUTE FUNCTION insights_calc_read_time();


-- ── Auto-record market price history ────────────────────────

CREATE OR REPLACE FUNCTION insights_record_price_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO insights_market_price_history (grade, price_per_kg, currency, recorded_at)
  VALUES (NEW.grade, NEW.price_per_kg, NEW.currency, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_insights_market_price_history
  AFTER INSERT OR UPDATE OF price_per_kg ON insights_market_prices
  FOR EACH ROW
  EXECUTE FUNCTION insights_record_price_history();
