-- Pembaruan manual melalui psql, tanpa harga bawaan.
-- Disarankan: gunakan Admin > Insights > Harga Pasar.
-- Jika memakai psql, berikan -v price_a=... -v price_b=... -v price_c=...
-- Nilai wajib diisi operator. Jangan menjalankan ulang seed/migrasi lama.
\set ON_ERROR_STOP on
BEGIN;
CREATE TEMP TABLE market_price_input (
  grade text PRIMARY KEY,
  price_per_kg numeric NOT NULL CHECK (price_per_kg > 0 AND scale(price_per_kg) <= 2)
) ON COMMIT DROP;
INSERT INTO market_price_input VALUES
  ('A', :'price_a'::numeric),
  ('B', :'price_b'::numeric),
  ('C', :'price_c'::numeric);
UPDATE insights_market_prices AS prices
SET price_per_kg = input.price_per_kg, updated_at = now()
FROM market_price_input AS input
WHERE prices.grade::text = input.grade;
COMMIT;
SELECT grade, price_per_kg, currency, updated_at FROM insights_market_prices ORDER BY grade;
