-- 1. Create circular_products table
CREATE TABLE IF NOT EXISTS circular_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL, -- Organic Compost, Biochar, Patchouli Hydrosol
  description text NOT NULL,
  benefit text NOT NULL,
  price double precision NOT NULL,
  stock double precision NOT NULL,
  unit text NOT NULL,
  image text DEFAULT '',
  status text NOT NULL DEFAULT 'DRAFT',
  rejection_reason text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Alter existing cart_items and order_items tables to make product_id nullable and add circular_product_id reference
ALTER TABLE cart_items ALTER COLUMN product_id DROP NOT NULL;
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS circular_product_id uuid REFERENCES circular_products(id) ON DELETE CASCADE;

ALTER TABLE order_items ALTER COLUMN product_id DROP NOT NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS circular_product_id uuid REFERENCES circular_products(id) ON DELETE SET NULL;

-- 3. Seed Circular Products mapped to existing supplier user IDs
DELETE FROM order_items WHERE circular_product_id IN (
  '80000000-0000-0000-0000-000000000001',
  '80000000-0000-0000-0000-000000000002',
  '80000000-0000-0000-0000-000000000003',
  '80000000-0000-0000-0000-000000000004',
  '80000000-0000-0000-0000-000000000005',
  '80000000-0000-0000-0000-000000000006'
);
DELETE FROM circular_products WHERE id IN (
  '80000000-0000-0000-0000-000000000001',
  '80000000-0000-0000-0000-000000000002',
  '80000000-0000-0000-0000-000000000003',
  '80000000-0000-0000-0000-000000000004',
  '80000000-0000-0000-0000-000000000005',
  '80000000-0000-0000-0000-000000000006'
);
DELETE FROM payments WHERE order_id = '90000000-0000-0000-0000-000000000001';
DELETE FROM shipments WHERE order_id = '90000000-0000-0000-0000-000000000001';
DELETE FROM orders WHERE id = '90000000-0000-0000-0000-000000000001';

-- Supplier A (user_id: 20000000-0000-0000-0000-000000000002)
-- - Organic Compost (APPROVED)
-- - Biochar (APPROVED)
-- - Compost Premium (PENDING)
-- - Compost Test (DRAFT)

INSERT INTO circular_products (id, supplier_id, name, category, description, benefit, price, stock, unit, image, status, created_at, updated_at)
VALUES 

  (
    '80000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    'Pupuk Kompos Organik Nilam Super',
    'Organic Compost',
    'Kompos organik berkualitas tinggi hasil olahan limbah ampas penyulingan daun nilam. Mengandung unsur hara makro dan mikro lengkap yang difermentasi menggunakan mikroba aktif untuk menyuburkan tanah tanaman keras.',
    'Meningkatkan kapasitas retensi air tanah, memperbaiki struktur mikroba tanah, serta merangsang pertumbuhan akar tanaman.',
    15000,
    500.0,
    'Sack (10 Kg)',
    'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=600&h=400&fit=crop',
    'APPROVED',
    now() - interval '5 days',
    now() - interval '5 days'
  ),
  (
    '80000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    'Biochar Nilam Teraktivasi',
    'Biochar',
    'Arang hayati hasil pirolisis lambat sisa ranting dan batang nilam pasca-suling. Sangat efektif sebagai pembenah tanah (soil conditioner) jangka panjang untuk mengunci karbon di dalam tanah.',
    'Meningkatkan pH tanah masam, mengurangi pencucian pupuk kimia, serta menjadi habitat yang baik bagi bakteri penyubur tanah.',
    22000,
    250.0,
    'Sack (5 Kg)',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop',
    'APPROVED',
    now() - interval '4 days',
    now() - interval '4 days'
  ),
  (
    '80000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000002',
    'Kompos Nilam Premium Batch B',
    'Organic Compost',
    'Pupuk organik ampas nilam yang diperkaya dengan kalium alamiah untuk fase pembuahan tanaman hortikultura.',
    'Mempercepat proses pembuahan dan meningkatkan resistensi tanaman terhadap hama.',
    18000,
    100.0,
    'Sack (10 Kg)',
    'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=600&h=400&fit=crop',
    'PENDING',
    now() - interval '2 days',
    now() - interval '2 days'
  ),
  (
    '80000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000002',
    'Biochar Nilam Kasar Draft',
    'Biochar',
    'Biochar mentah belum digiling halus, cocok untuk penutup bedengan perkebunan.',
    'Mengurangi penguapan air tanah di musim kemarau dan menekan gulma.',
    12000,
    50.0,
    'Sack (10 Kg)',
    '',
    'DRAFT',
    now(),
    now()
  );

-- Supplier B (user_id: 20000000-0000-0000-0000-000000000003)
-- - Patchouli Hydrosol (APPROVED)
-- - Hydrosol Murni Rejected (REJECTED)

INSERT INTO circular_products (id, supplier_id, name, category, description, benefit, price, stock, unit, image, status, rejection_reason, created_at, updated_at)
VALUES 
  (
    '80000000-0000-0000-0000-000000000005',
    '20000000-0000-0000-0000-000000000003',
    'Distilled Patchouli Hydrosol Pure',
    'Patchouli Hydrosol',
    'Air kondensat murni hasil distilasi uap minyak nilam. Memiliki aroma herba nilam lembut yang menenangkan. Sangat cocok sebagai bahan baku toner kosmetik, sabun organik, maupun pewangi ruangan alami.',
    'Berfungsi sebagai antiseptik alami, agen anti-inflamasi kulit, serta pelembab wajah organik yang menyegarkan.',
    35000,
    300.0,
    'Jerigen (1 Liter)',
    'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=400&fit=crop',
    'APPROVED',
    '',
    now() - interval '6 days',
    now() - interval '6 days'
  ),
  (
    '80000000-0000-0000-0000-000000000006',
    '20000000-0000-0000-0000-000000000003',
    'Hydrosol Nilam Campuran',
    'Patchouli Hydrosol',
    'Hydrosol nilam kualitas rendah karena ada rembesan sisa karat tangki distilasi besi.',
    'Menyegarkan udara luar ruangan.',
    15000,
    0,
    'Jerigen (1 Liter)',
    '',
    'REJECTED',
    'Aroma tercampur bau besi penyulingan dan mengandung endapan karat logam berat, tidak aman untuk kulit.',
    now() - interval '10 days',
    now() - interval '10 days'
  );

-- 4. Seed some dummy transactions for Circular Products
-- We will insert an order from a buyer account (user_id: 20000000-0000-0000-0000-000000000004)
-- to Supplier A (20000000-0000-0000-0000-000000000002) for Compost and Biochar
INSERT INTO orders (id, order_number, buyer_id, supplier_id, status, total_amount, shipping_cost, shipping_address, payment_status, created_at)
VALUES (
  '90000000-0000-0000-0000-000000000001',
  'ORD-CIRCULAR-001',
  '20000000-0000-0000-0000-000000000004', -- Buyer
  '20000000-0000-0000-0000-000000000002', -- Supplier A
  'COMPLETED',
  590000,
  50000,
  '{"address": "Jl. Iskandar Muda No. 100, Banda Aceh"}',
  'PAID',
  now() - interval '3 days'
);

INSERT INTO order_items (id, order_id, product_id, circular_product_id, quantity_kg, price_per_kg, subtotal)
VALUES 
  (
    '90000000-0000-0000-0000-000000000002',
    '90000000-0000-0000-0000-000000000001',
    NULL,
    '80000000-0000-0000-0000-000000000001', -- Compost (15000 per sack)
    20.0, -- 20 sacks
    15000,
    300000
  ),
  (
    '90000000-0000-0000-0000-000000000003',
    '90000000-0000-0000-0000-000000000001',
    NULL,
    '80000000-0000-0000-0000-000000000002', -- Biochar (22000 per sack)
    10.0, -- 10 sacks
    22000,
    220000
  );

-- Create initial shipment entry for this circular order
INSERT INTO shipments (id, order_id, shipment_type, courier_name, courier_code, total_shipping_cost, actual_weight, origin_address, destination_address, status, created_at, updated_at)
VALUES (
  '90000000-0000-0000-0000-000000000004',
  '90000000-0000-0000-0000-000000000001',
  'DOMESTIK',
  'Biteship Cargo (Truk)',
  'cargo_truck',
  50000,
  300.0,
  '{}',
  '{}',
  'TIBA_DI_TUJUAN',
  now() - interval '3 days',
  now() - interval '1 days'
);

-- Create initial payment entry for this circular order
INSERT INTO payments (id, order_id, amount, status, paid_at)
VALUES (
  '90000000-0000-0000-0000-000000000005',
  '90000000-0000-0000-0000-000000000001',
  590000,
  'settlement',
  now() - interval '3 days'
);
