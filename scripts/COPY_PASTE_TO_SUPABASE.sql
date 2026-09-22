-- ============================================================
-- UPDATE MARKET PRICES - Copy & Paste ke Supabase SQL Editor
-- ============================================================
-- Steps:
-- 1. Buka: https://app.supabase.com
-- 2. Pilih project Valam
-- 3. Klik: SQL Editor (atau Database → SQL)
-- 4. Copy-paste query di bawah ini
-- 5. Klik "Run"
-- ============================================================

-- Upsert Grade A, B, C dengan harga yang benar
INSERT INTO insights_market_prices (grade, price_per_kg, currency, updated_at)
VALUES
  ('A', 850000, 'IDR', now()),
  ('B', 780000, 'IDR', now()),
  ('C', 680000, 'IDR', now())
ON CONFLICT (grade) DO UPDATE SET
  price_per_kg = EXCLUDED.price_per_kg,
  updated_at = now();

-- Verify hasil
SELECT grade, price_per_kg, currency, updated_at FROM insights_market_prices ORDER BY grade;
