-- ============================================================
-- Update Market Prices to Match Grade Specs
-- ============================================================
-- Grade A: 850,000 IDR (Premium, PA ≥ 32%)
-- Grade B: 780,000 IDR (Standard, PA 28-31%)
-- Grade C: 680,000 IDR (Basic, PA < 28%)
-- ============================================================

-- Ensure all grades exist with correct prices
INSERT INTO insights_market_prices (grade, price_per_kg, currency)
VALUES
  ('A', 850000, 'IDR'),
  ('B', 780000, 'IDR'),
  ('C', 680000, 'IDR')
ON CONFLICT (grade) DO UPDATE SET
  price_per_kg = EXCLUDED.price_per_kg,
  updated_at = now();

-- Create audit log entry
INSERT INTO insights_market_price_history (grade, price_per_kg, currency, recorded_at)
SELECT grade, price_per_kg, currency, now()
FROM insights_market_prices
WHERE grade IN ('A', 'B', 'C');
