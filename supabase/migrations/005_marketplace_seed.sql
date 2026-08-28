-- ============================================================
-- Valam B2B Marketplace — Seed Mock Data
-- ============================================================

-- ── 1. Clean Up Existing Mock Data (Reverse Dependency Order) ──

-- Delete notifications
DELETE FROM notifications WHERE user_id IN (
  SELECT id FROM users WHERE email IN ('kontak@koperasinilamjaya.com', 'info@kudmakmursejahtera.id', 'admin@atsirigayo.co.id', 'hub@nilamacehselatan.com', 'procurement@globalpatchoulibuyer.com', 'supplier1@example.com', 'supplier2@example.com', 'supplier3@example.com', 'supplier4@example.com', 'buyer1@example.com')
);

-- Delete RFQ responses and requests
DELETE FROM rfq_responses WHERE supplier_id IN (
  SELECT id FROM users WHERE email IN ('kontak@koperasinilamjaya.com', 'info@kudmakmursejahtera.id', 'admin@atsirigayo.co.id', 'hub@nilamacehselatan.com', 'supplier1@example.com', 'supplier2@example.com', 'supplier3@example.com', 'supplier4@example.com')
);

DELETE FROM rfq_requests WHERE supplier_id IN (
  SELECT id FROM users WHERE email IN ('kontak@koperasinilamjaya.com', 'info@kudmakmursejahtera.id', 'admin@atsirigayo.co.id', 'hub@nilamacehselatan.com', 'supplier1@example.com', 'supplier2@example.com', 'supplier3@example.com', 'supplier4@example.com')
) OR buyer_id IN (
  SELECT id FROM users WHERE email IN ('procurement@globalpatchoulibuyer.com', 'buyer1@example.com')
);

-- Delete cart items
DELETE FROM cart_items WHERE product_id IN (
  SELECT id FROM products WHERE supplier_id IN (
    SELECT id FROM users WHERE email IN ('kontak@koperasinilamjaya.com', 'info@kudmakmursejahtera.id', 'admin@atsirigayo.co.id', 'hub@nilamacehselatan.com', 'supplier1@example.com', 'supplier2@example.com', 'supplier3@example.com', 'supplier4@example.com')
  )
) OR user_id IN (
  SELECT id FROM users WHERE email IN ('procurement@globalpatchoulibuyer.com', 'buyer1@example.com')
);

-- Delete order payments and shipments
DELETE FROM payments WHERE order_id IN (
  SELECT id FROM orders WHERE supplier_id IN (
    SELECT id FROM users WHERE email IN ('kontak@koperasinilamjaya.com', 'info@kudmakmursejahtera.id', 'admin@atsirigayo.co.id', 'hub@nilamacehselatan.com', 'supplier1@example.com', 'supplier2@example.com', 'supplier3@example.com', 'supplier4@example.com')
  ) OR buyer_id IN (
    SELECT id FROM users WHERE email IN ('procurement@globalpatchoulibuyer.com', 'buyer1@example.com')
  )
);

DELETE FROM shipment_tracking_logs WHERE shipment_id IN (
  SELECT id FROM shipments WHERE order_id IN (
    SELECT id FROM orders WHERE supplier_id IN (
      SELECT id FROM users WHERE email IN ('kontak@koperasinilamjaya.com', 'info@kudmakmursejahtera.id', 'admin@atsirigayo.co.id', 'hub@nilamacehselatan.com', 'supplier1@example.com', 'supplier2@example.com', 'supplier3@example.com', 'supplier4@example.com')
    ) OR buyer_id IN (
      SELECT id FROM users WHERE email IN ('procurement@globalpatchoulibuyer.com', 'buyer1@example.com')
    )
  )
);

DELETE FROM shipments WHERE order_id IN (
  SELECT id FROM orders WHERE supplier_id IN (
    SELECT id FROM users WHERE email IN ('kontak@koperasinilamjaya.com', 'info@kudmakmursejahtera.id', 'admin@atsirigayo.co.id', 'hub@nilamacehselatan.com', 'supplier1@example.com', 'supplier2@example.com', 'supplier3@example.com', 'supplier4@example.com')
  ) OR buyer_id IN (
    SELECT id FROM users WHERE email IN ('procurement@globalpatchoulibuyer.com', 'buyer1@example.com')
  )
);

-- Delete order items and orders
DELETE FROM order_items WHERE product_id IN (
  SELECT id FROM products WHERE supplier_id IN (
    SELECT id FROM users WHERE email IN ('kontak@koperasinilamjaya.com', 'info@kudmakmursejahtera.id', 'admin@atsirigayo.co.id', 'hub@nilamacehselatan.com', 'supplier1@example.com', 'supplier2@example.com', 'supplier3@example.com', 'supplier4@example.com')
  )
);

DELETE FROM orders WHERE supplier_id IN (
  SELECT id FROM users WHERE email IN ('kontak@koperasinilamjaya.com', 'info@kudmakmursejahtera.id', 'admin@atsirigayo.co.id', 'hub@nilamacehselatan.com', 'supplier1@example.com', 'supplier2@example.com', 'supplier3@example.com', 'supplier4@example.com')
) OR buyer_id IN (
  SELECT id FROM users WHERE email IN ('procurement@globalpatchoulibuyer.com', 'buyer1@example.com')
);

-- Delete trace logs, certificates, and QC results
DELETE FROM trace_logs WHERE product_id IN (
  SELECT id FROM products WHERE supplier_id IN (
    SELECT id FROM users WHERE email IN ('kontak@koperasinilamjaya.com', 'info@kudmakmursejahtera.id', 'admin@atsirigayo.co.id', 'hub@nilamacehselatan.com', 'supplier1@example.com', 'supplier2@example.com', 'supplier3@example.com', 'supplier4@example.com')
  )
);

DELETE FROM certificates WHERE product_id IN (
  SELECT id FROM products WHERE supplier_id IN (
    SELECT id FROM users WHERE email IN ('kontak@koperasinilamjaya.com', 'info@kudmakmursejahtera.id', 'admin@atsirigayo.co.id', 'hub@nilamacehselatan.com', 'supplier1@example.com', 'supplier2@example.com', 'supplier3@example.com', 'supplier4@example.com')
  )
);

DELETE FROM qc_results WHERE product_id IN (
  SELECT id FROM products WHERE supplier_id IN (
    SELECT id FROM users WHERE email IN ('kontak@koperasinilamjaya.com', 'info@kudmakmursejahtera.id', 'admin@atsirigayo.co.id', 'hub@nilamacehselatan.com', 'supplier1@example.com', 'supplier2@example.com', 'supplier3@example.com', 'supplier4@example.com')
  )
);

DELETE FROM product_parameters WHERE product_id IN (
  SELECT id FROM products WHERE supplier_id IN (
    SELECT id FROM users WHERE email IN ('kontak@koperasinilamjaya.com', 'info@kudmakmursejahtera.id', 'admin@atsirigayo.co.id', 'hub@nilamacehselatan.com', 'supplier1@example.com', 'supplier2@example.com', 'supplier3@example.com', 'supplier4@example.com')
  )
);

DELETE FROM products WHERE supplier_id IN (
  SELECT id FROM users WHERE email IN ('kontak@koperasinilamjaya.com', 'info@kudmakmursejahtera.id', 'admin@atsirigayo.co.id', 'hub@nilamacehselatan.com', 'supplier1@example.com', 'supplier2@example.com', 'supplier3@example.com', 'supplier4@example.com')
);

DELETE FROM wallet_transactions WHERE wallet_id IN (
  SELECT id FROM wallets WHERE user_id IN (
    SELECT id FROM users WHERE email IN ('kontak@koperasinilamjaya.com', 'info@kudmakmursejahtera.id', 'admin@atsirigayo.co.id', 'hub@nilamacehselatan.com', 'procurement@globalpatchoulibuyer.com', 'supplier1@example.com', 'supplier2@example.com', 'supplier3@example.com', 'supplier4@example.com', 'buyer1@example.com')
  )
);

DELETE FROM withdrawals WHERE wallet_id IN (
  SELECT id FROM wallets WHERE user_id IN (
    SELECT id FROM users WHERE email IN ('kontak@koperasinilamjaya.com', 'info@kudmakmursejahtera.id', 'admin@atsirigayo.co.id', 'hub@nilamacehselatan.com', 'procurement@globalpatchoulibuyer.com', 'supplier1@example.com', 'supplier2@example.com', 'supplier3@example.com', 'supplier4@example.com', 'buyer1@example.com')
  )
);

DELETE FROM wallets WHERE user_id IN (
  SELECT id FROM users WHERE email IN ('kontak@koperasinilamjaya.com', 'info@kudmakmursejahtera.id', 'admin@atsirigayo.co.id', 'hub@nilamacehselatan.com', 'procurement@globalpatchoulibuyer.com', 'supplier1@example.com', 'supplier2@example.com', 'supplier3@example.com', 'supplier4@example.com', 'buyer1@example.com')
);

DELETE FROM profiles WHERE user_id IN (
  SELECT id FROM users WHERE email IN ('kontak@koperasinilamjaya.com', 'info@kudmakmursejahtera.id', 'admin@atsirigayo.co.id', 'hub@nilamacehselatan.com', 'procurement@globalpatchoulibuyer.com', 'supplier1@example.com', 'supplier2@example.com', 'supplier3@example.com', 'supplier4@example.com', 'buyer1@example.com')
);

DELETE FROM supplier_profiles WHERE user_id IN (
  SELECT id FROM users WHERE email IN ('kontak@koperasinilamjaya.com', 'info@kudmakmursejahtera.id', 'admin@atsirigayo.co.id', 'hub@nilamacehselatan.com', 'supplier1@example.com', 'supplier2@example.com', 'supplier3@example.com', 'supplier4@example.com')
);

DELETE FROM users WHERE email IN ('kontak@koperasinilamjaya.com', 'info@kudmakmursejahtera.id', 'admin@atsirigayo.co.id', 'hub@nilamacehselatan.com', 'procurement@globalpatchoulibuyer.com', 'supplier1@example.com', 'supplier2@example.com', 'supplier3@example.com', 'supplier4@example.com', 'buyer1@example.com');


-- ── 2. Ensure Roles Exist ────────────────────────────────────

INSERT INTO roles (id, name, permissions)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'admin', '{}'::jsonb),
  ('10000000-0000-0000-0000-000000000002', 'supplier', '{}'::jsonb),
  ('10000000-0000-0000-0000-000000000003', 'buyer', '{}'::jsonb)
ON CONFLICT (name) DO NOTHING;


-- ── 3. Seed Users ────────────────────────────────────────────
-- Passwords are hashed values for 'password123'

INSERT INTO users (id, email, password, role_id, status, email_verified, created_at, updated_at)
VALUES
  (
    '20000000-0000-0000-0000-000000000001', 
    'admin@valam.id', 
    '$2b$10$NiiUH5CcPLDb/67rR5c16.NYNrW9xzNSCMqmrFQYB33fqKiNxi9C.', 
    (SELECT id FROM roles WHERE name = 'admin' LIMIT 1), 
    'active', true, now(), now()
  )
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, password, role_id, status, email_verified, created_at, updated_at)
VALUES
  (
    '20000000-0000-0000-0000-000000000002', 
    'kontak@koperasinilamjaya.com', 
    '$2b$10$NiiUH5CcPLDb/67rR5c16.NYNrW9xzNSCMqmrFQYB33fqKiNxi9C.', 
    (SELECT id FROM roles WHERE name = 'supplier' LIMIT 1), 
    'active', true, now(), now()
  ),
  (
    '20000000-0000-0000-0000-000000000003', 
    'info@kudmakmursejahtera.id', 
    '$2b$10$NiiUH5CcPLDb/67rR5c16.NYNrW9xzNSCMqmrFQYB33fqKiNxi9C.', 
    (SELECT id FROM roles WHERE name = 'supplier' LIMIT 1), 
    'active', true, now(), now()
  ),
  (
    '20000000-0000-0000-0000-000000000005', 
    'admin@atsirigayo.co.id', 
    '$2b$10$NiiUH5CcPLDb/67rR5c16.NYNrW9xzNSCMqmrFQYB33fqKiNxi9C.', 
    (SELECT id FROM roles WHERE name = 'supplier' LIMIT 1), 
    'active', true, now(), now()
  ),
  (
    '20000000-0000-0000-0000-000000000006', 
    'hub@nilamacehselatan.com', 
    '$2b$10$NiiUH5CcPLDb/67rR5c16.NYNrW9xzNSCMqmrFQYB33fqKiNxi9C.', 
    (SELECT id FROM roles WHERE name = 'supplier' LIMIT 1), 
    'active', true, now(), now()
  ),
  (
    '20000000-0000-0000-0000-000000000004', 
    'procurement@globalpatchoulibuyer.com', 
    '$2b$10$NiiUH5CcPLDb/67rR5c16.NYNrW9xzNSCMqmrFQYB33fqKiNxi9C.', 
    (SELECT id FROM roles WHERE name = 'buyer' LIMIT 1), 
    'active', true, now(), now()
  )
ON CONFLICT (email) DO NOTHING;


-- ── 4. Seed User Profiles ─────────────────────────────────────

INSERT INTO profiles (id, user_id, company_name, contact_person, phone, address)
VALUES
  (
    '30000000-0000-0000-0000-000000000001', 
    (SELECT id FROM users WHERE email = 'admin@valam.id' LIMIT 1), 
    'Valam QC & Admin Center', 
    'Dr. Iskandar', 
    '+62811002233', 
    'Banda Aceh, Indonesia'
  )
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO profiles (id, user_id, company_name, contact_person, phone, address)
VALUES
  (
    '30000000-0000-0000-0000-000000000002', 
    '20000000-0000-0000-0000-000000000002', 
    'Koperasi Nilam Jaya', 
    'Budi Santoso', 
    '+6281234567890', 
    'Jl. Teuku Umar No. 45, Aceh Barat'
  ),
  (
    '30000000-0000-0000-0000-000000000003', 
    '20000000-0000-0000-0000-000000000003', 
    'KUD Makmur Sejahtera', 
    'Siti Rahma', 
    '+6281234567891', 
    'Jl. Gajah Mada No. 12, Aceh Jaya'
  ),
  (
    '30000000-0000-0000-0000-000000000005', 
    '20000000-0000-0000-0000-000000000005', 
    'Koperasi Produsen Atsiri Gayo', 
    'Rahmat Gayo', 
    '+6281234567892', 
    'Jl. Takengon No. 89, Aceh Tengah'
  ),
  (
    '30000000-0000-0000-0000-000000000006', 
    '20000000-0000-0000-0000-000000000006', 
    'Koperasi Nilam Aceh Selatan', 
    'M. Yusuf', 
    '+6281234567893', 
    'Jl. Tapaktuan No. 34, Aceh Selatan'
  ),
  (
    '30000000-0000-0000-0000-000000000004', 
    '20000000-0000-0000-0000-000000000004', 
    'Global Patchouli Trading Ltd.', 
    'Pierre Dupont', 
    '+33140262000', 
    'Rue de la Paix 15, Paris, France'
  )
ON CONFLICT (user_id) DO NOTHING;


-- ── 5. Seed Supplier Profiles ─────────────────────────────────

INSERT INTO supplier_profiles (
  id, user_id, nama_koperasi, nib, npwp, nama_pic, ktp_pic, whatsapp, 
  alamat_lengkap, kabupaten, kecamatan, desa, kapasitas_produksi,
  nomor_rekening, nama_bank, nama_rekening, tahun_berdiri, jumlah_anggota,
  minimum_order, durasi_produksi, metode_distilasi, bahan_baku, status,
  grade_nilam, created_at, updated_at
)
VALUES
  (
    '40000000-0000-0000-0000-000000000002', 
    '20000000-0000-0000-0000-000000000002', 
    'Koperasi Nilam Jaya', '123456789', '01.234.567.8-901.000', 'Budi Santoso', '1234567890123456', '+6281234567890',
    'Jl. Teuku Umar No. 45', 'Aceh Barat', 'Johan Pahlawan', 'Ujong Baroh', 1000.0,
    '1234567890', 'Bank Syariah Indonesia (BSI)', 'Koperasi Nilam Jaya', '2020', 45,
    10.0, '7-14 Hari', 'Uap (Steam Distillation)', '100% Daun Nilam Segar', 'TERVERIFIKASI'::"SupplierStatus",
    ARRAY['GRADE_A', 'GRADE_B']::"GradeNilam"[], now(), now()
  ),
  (
    '40000000-0000-0000-0000-000000000003', 
    '20000000-0000-0000-0000-000000000003', 
    'KUD Makmur Sejahtera', '987654321', '01.987.654.3-210.000', 'Siti Rahma', '6543210987654321', '+6281234567891',
    'Jl. Gajah Mada No. 12', 'Aceh Jaya', 'Krueng Sabee', 'Keude Krueng Sabee', 800.0,
    '0987654321', 'Bank Mandiri', 'KUD Makmur Sejahtera', '2018', 35,
    10.0, '7-14 Hari', 'Uap (Steam Distillation)', '100% Daun Nilam Segar', 'TERVERIFIKASI'::"SupplierStatus",
    ARRAY['GRADE_B', 'GRADE_C']::"GradeNilam"[], now(), now()
  ),
  (
    '40000000-0000-0000-0000-000000000005', 
    '20000000-0000-0000-0000-000000000005', 
    'Koperasi Produsen Atsiri Gayo', '543216789', '01.543.216.7-890.000', 'Rahmat Gayo', '1122334455667788', '+6281234567892',
    'Jl. Takengon No. 89', 'Aceh Tengah', 'Lut Tawar', 'Takengon Barat', 1200.0,
    '1122334455', 'Bank Aceh Syariah', 'Koperasi Atsiri Gayo', '2019', 30,
    5.0, '7-14 Hari', 'Uap (Steam Distillation)', '100% Daun Nilam Segar', 'TERVERIFIKASI'::"SupplierStatus",
    ARRAY['GRADE_A', 'GRADE_B']::"GradeNilam"[], now(), now()
  ),
  (
    '40000000-0000-0000-0000-000000000006', 
    '20000000-0000-0000-0000-000000000006', 
    'Koperasi Nilam Aceh Selatan', '678954321', '01.678.954.3-210.000', 'M. Yusuf', '8877665544332211', '+6281234567893',
    'Jl. Tapaktuan No. 34', 'Aceh Selatan', 'Tapaktuan', 'Lhok Ketapang', 1500.0,
    '2233445566', 'Bank BNI', 'Koperasi Nilam Selatan', '2021', 50,
    10.0, '7-14 Hari', 'Uap (Steam Distillation)', '100% Daun Nilam Segar', 'TERVERIFIKASI'::"SupplierStatus",
    ARRAY['GRADE_A', 'GRADE_B', 'GRADE_C']::"GradeNilam"[], now(), now()
  )
ON CONFLICT (user_id) DO NOTHING;


-- ── 6. Seed Wallets ───────────────────────────────────────────

INSERT INTO wallets (id, user_id, balance, updated_at)
VALUES
  ('50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 15000000.00, now()),
  ('50000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 8500000.00, now()),
  ('50000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005', 12000000.00, now()),
  ('50000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000006', 9500000.00, now()),
  ('50000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 50000000.00, now())
ON CONFLICT (user_id) DO NOTHING;


-- ── 7. Seed Products / Batches ────────────────────────────────

INSERT INTO products (
  id, supplier_id, batch_code, status, origin_village, origin_district, origin_province, 
  production_date, total_volume_kg, available_volume_kg, moq_kg, price_per_kg, images, created_at, updated_at
)
VALUES
  (
    '60000000-0000-0000-0000-000000000001', 
    '20000000-0000-0000-0000-000000000002', 
    'VAL-ACEH-001', 'VERIFIED', 'Ujong Baroh', 'Aceh Barat', 'Aceh', 
    now() - interval '10 days', 350.0, 350.0, 10.0, 820000.00, ARRAY[]::text[], now(), now()
  ),
  (
    '60000000-0000-0000-0000-000000000002', 
    '20000000-0000-0000-0000-000000000002', 
    'VAL-ACEH-002', 'VERIFIED', 'Keude Krueng Sabee', 'Aceh Jaya', 'Aceh', 
    now() - interval '8 days', 200.0, 200.0, 10.0, 780000.00, ARRAY[]::text[], now(), now()
  ),
  (
    '60000000-0000-0000-0000-000000000003', 
    '20000000-0000-0000-0000-000000000003', 
    'VAL-ACEH-003', 'VERIFIED', 'Alue Bilie', 'Nagan Raya', 'Aceh', 
    now() - interval '12 days', 150.0, 150.0, 10.0, 690000.00, ARRAY[]::text[], now(), now()
  ),
  (
    '60000000-0000-0000-0000-000000000004', 
    '20000000-0000-0000-0000-000000000003', 
    'VAL-ACEH-004', 'DRAFT', 'Kuala Batee', 'Aceh Barat Daya', 'Aceh', 
    now() - interval '2 days', 400.0, 400.0, 10.0, 720000.00, ARRAY[]::text[], now(), now()
  ),
  (
    '60000000-0000-0000-0000-000000000005', 
    '20000000-0000-0000-0000-000000000005', 
    'VAL-ACEH-005', 'VERIFIED', 'Takengon Barat', 'Aceh Tengah', 'Aceh', 
    now() - interval '5 days', 250.0, 250.0, 5.0, 840000.00, ARRAY[]::text[], now(), now()
  ),
  (
    '60000000-0000-0000-0000-000000000006', 
    '20000000-0000-0000-0000-000000000005', 
    'VAL-ACEH-006', 'VERIFIED', 'Wih Pesam', 'Bener Meriah', 'Aceh', 
    now() - interval '6 days', 180.0, 180.0, 5.0, 760000.00, ARRAY[]::text[], now(), now()
  ),
  (
    '60000000-0000-0000-0000-000000000007', 
    '20000000-0000-0000-0000-000000000006', 
    'VAL-ACEH-007', 'VERIFIED', 'Lhok Ketapang', 'Aceh Selatan', 'Aceh', 
    now() - interval '4 days', 300.0, 300.0, 10.0, 830000.00, ARRAY[]::text[], now(), now()
  ),
  (
    '60000000-0000-0000-0000-000000000008', 
    '20000000-0000-0000-0000-000000000006', 
    'VAL-ACEH-008', 'VERIFIED', 'Singkil Barat', 'Aceh Singkil', 'Aceh', 
    now() - interval '9 days', 220.0, 220.0, 10.0, 670000.00, ARRAY[]::text[], now(), now()
  )
ON CONFLICT (batch_code) DO NOTHING;


-- ── 8. Seed Product Parameters ────────────────────────────────

INSERT INTO product_parameters (id, product_id, parameter_name, value, unit, standard_min, standard_max, status)
VALUES
  -- VAL-ACEH-001 (Grade A)
  ('70000000-0000-0000-0000-000000000011', '60000000-0000-0000-0000-000000000001', 'PA_PERCENTAGE', 33.2, '%', 30.0, 100.0, 'pass'),
  ('70000000-0000-0000-0000-000000000012', '60000000-0000-0000-0000-000000000001', 'MOISTURE', 0.8, '%', 0.0, 1.0, 'pass'),
  ('70000000-0000-0000-0000-000000000013', '60000000-0000-0000-0000-000000000001', 'SPECIFIC_GRAVITY', 0.962, '', 0.950, 0.970, 'pass'),
  
  -- VAL-ACEH-002 (Grade B)
  ('70000000-0000-0000-0000-000000000021', '60000000-0000-0000-0000-000000000002', 'PA_PERCENTAGE', 31.5, '%', 30.0, 100.0, 'pass'),
  ('70000000-0000-0000-0000-000000000022', '60000000-0000-0000-0000-000000000002', 'MOISTURE', 1.1, '%', 0.0, 1.0, 'pass'),
  ('70000000-0000-0000-0000-000000000023', '60000000-0000-0000-0000-000000000002', 'SPECIFIC_GRAVITY', 0.965, '', 0.950, 0.970, 'pass'),
  
  -- VAL-ACEH-003 (Grade C)
  ('70000000-0000-0000-0000-000000000031', '60000000-0000-0000-0000-000000000003', 'PA_PERCENTAGE', 29.8, '%', 30.0, 100.0, 'pass'),
  ('70000000-0000-0000-0000-000000000032', '60000000-0000-0000-0000-000000000003', 'MOISTURE', 1.3, '%', 0.0, 1.0, 'pass'),
  ('70000000-0000-0000-0000-000000000033', '60000000-0000-0000-0000-000000000003', 'SPECIFIC_GRAVITY', 0.968, '', 0.950, 0.970, 'pass'),

  -- VAL-ACEH-005 (Grade A)
  ('70000000-0000-0000-0000-000000000051', '60000000-0000-0000-0000-000000000005', 'PA_PERCENTAGE', 34.0, '%', 30.0, 100.0, 'pass'),
  ('70000000-0000-0000-0000-000000000052', '60000000-0000-0000-0000-000000000005', 'MOISTURE', 0.7, '%', 0.0, 1.0, 'pass'),
  ('70000000-0000-0000-0000-000000000053', '60000000-0000-0000-0000-000000000005', 'SPECIFIC_GRAVITY', 0.960, '', 0.950, 0.970, 'pass'),

  -- VAL-ACEH-006 (Grade B)
  ('70000000-0000-0000-0000-000000000061', '60000000-0000-0000-0000-000000000006', 'PA_PERCENTAGE', 30.8, '%', 30.0, 100.0, 'pass'),
  ('70000000-0000-0000-0000-000000000062', '60000000-0000-0000-0000-000000000006', 'MOISTURE', 1.0, '%', 0.0, 1.0, 'pass'),
  ('70000000-0000-0000-0000-000000000063', '60000000-0000-0000-0000-000000000006', 'SPECIFIC_GRAVITY', 0.963, '', 0.950, 0.970, 'pass'),

  -- VAL-ACEH-007 (Grade A)
  ('70000000-0000-0000-0000-000000000071', '60000000-0000-0000-0000-000000000007', 'PA_PERCENTAGE', 32.8, '%', 30.0, 100.0, 'pass'),
  ('70000000-0000-0000-0000-000000000072', '60000000-0000-0000-0000-000000000007', 'MOISTURE', 0.9, '%', 0.0, 1.0, 'pass'),
  ('70000000-0000-0000-0000-000000000073', '60000000-0000-0000-0000-000000000007', 'SPECIFIC_GRAVITY', 0.961, '', 0.950, 0.970, 'pass'),

  -- VAL-ACEH-008 (Grade C)
  ('70000000-0000-0000-0000-000000000081', '60000000-0000-0000-0000-000000000008', 'PA_PERCENTAGE', 28.5, '%', 30.0, 100.0, 'pass'),
  ('70000000-0000-0000-0000-000000000082', '60000000-0000-0000-0000-000000000008', 'MOISTURE', 1.2, '%', 0.0, 1.0, 'pass'),
  ('70000000-0000-0000-0000-000000000083', '60000000-0000-0000-0000-000000000008', 'SPECIFIC_GRAVITY', 0.967, '', 0.950, 0.970, 'pass')
ON CONFLICT (id) DO NOTHING;


-- ── 9. Seed QC Results ────────────────────────────────────────

INSERT INTO qc_results (
  id, product_id, admin_id, pa_percentage, moisture, specific_gravity, refractive_index, optical_rotation, overall_status, tested_at, lab_notes
)
VALUES
  (
    '80000000-0000-0000-0000-000000000001', 
    '60000000-0000-0000-0000-000000000001', 
    (SELECT id FROM users WHERE email = 'admin@valam.id' LIMIT 1), 
    33.2, 0.8, 0.962, 1.508, -54.0, 'pass', now() - interval '9 days', 'Minyak nilam berkualitas prima, jernih, kadar logam besi di bawah ambang batas ekspor.'
  ),
  (
    '80000000-0000-0000-0000-000000000002', 
    '60000000-0000-0000-0000-000000000002', 
    (SELECT id FROM users WHERE email = 'admin@valam.id' LIMIT 1), 
    31.5, 1.1, 0.965, 1.511, -51.0, 'pass', now() - interval '7 days', 'Kadar PA memenuhi standar ekspor, kelembaban sedikit tinggi tetapi masih dalam batas toleransi.'
  ),
  (
    '80000000-0000-0000-0000-000000000003', 
    '60000000-0000-0000-0000-000000000003', 
    (SELECT id FROM users WHERE email = 'admin@valam.id' LIMIT 1), 
    29.8, 1.3, 0.968, 1.513, -49.0, 'pass', now() - interval '11 days', 'Kadar PA di bawah 30% (Grade C). Cocok untuk industri lokal.'
  ),
  (
    '80000000-0000-0000-0000-000000000005', 
    '60000000-0000-0000-0000-000000000005', 
    (SELECT id FROM users WHERE email = 'admin@valam.id' LIMIT 1), 
    34.0, 0.7, 0.960, 1.506, -56.0, 'pass', now() - interval '4 days', 'Minyak Atsiri Gayo dengan kadar PA sangat tinggi dan aroma herbal yang khas.'
  ),
  (
    '80000000-0000-0000-0000-000000000006', 
    '60000000-0000-0000-0000-000000000006', 
    (SELECT id FROM users WHERE email = 'admin@valam.id' LIMIT 1), 
    30.8, 1.0, 0.963, 1.510, -50.0, 'pass', now() - interval '5 days', 'Kualitas standard Bener Meriah. Lulus parameter ekspor.'
  ),
  (
    '80000000-0000-0000-0000-000000000007', 
    '60000000-0000-0000-0000-000000000007', 
    (SELECT id FROM users WHERE email = 'admin@valam.id' LIMIT 1), 
    32.8, 0.9, 0.961, 1.507, -53.0, 'pass', now() - interval '3 days', 'Nilam Aceh Selatan dengan karakteristik PA premium dan kadar Fe sangat rendah.'
  ),
  (
    '80000000-0000-0000-0000-000000000008', 
    '60000000-0000-0000-0000-000000000008', 
    (SELECT id FROM users WHERE email = 'admin@valam.id' LIMIT 1), 
    28.5, 1.2, 0.967, 1.512, -47.0, 'pass', now() - interval '8 days', 'Nilam Aceh Singkil. Kadar PA 28.5% (Grade C).'
  )
ON CONFLICT (product_id) DO NOTHING;


-- ── 10. Seed Certificates (CoA) ───────────────────────────────

INSERT INTO certificates (
  id, product_id, qc_result_id, certificate_number, issued_at, admin_name, admin_signature_url, pdf_url, qr_code_url
)
VALUES
  (
    '90000000-0000-0000-0000-000000000001', 
    '60000000-0000-0000-0000-000000000001', 
    '80000000-0000-0000-0000-000000000001', 
    'COA-VAL-ACEH-001-A', now() - interval '9 days', 'Dr. Iskandar', 
    'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9', '/files/coa-aceh-001.pdf', 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=COA-VAL-ACEH-001-A'
  ),
  (
    '90000000-0000-0000-0000-000000000002', 
    '60000000-0000-0000-0000-000000000002', 
    '80000000-0000-0000-0000-000000000002', 
    'COA-VAL-ACEH-002-B', now() - interval '7 days', 'Dr. Iskandar', 
    'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9', '/files/coa-aceh-002.pdf', 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=COA-VAL-ACEH-002-B'
  ),
  (
    '90000000-0000-0000-0000-000000000003', 
    '60000000-0000-0000-0000-000000000003', 
    '80000000-0000-0000-0000-000000000003', 
    'COA-VAL-ACEH-003-C', now() - interval '11 days', 'Dr. Iskandar', 
    'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9', '/files/coa-aceh-003.pdf', 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=COA-VAL-ACEH-003-C'
  ),
  (
    '90000000-0000-0000-0000-000000000005', 
    '60000000-0000-0000-0000-000000000005', 
    '80000000-0000-0000-0000-000000000005', 
    'COA-VAL-ACEH-005-A', now() - interval '4 days', 'Dr. Iskandar', 
    'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9', '/files/coa-aceh-005.pdf', 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=COA-VAL-ACEH-005-A'
  ),
  (
    '90000000-0000-0000-0000-000000000006', 
    '60000000-0000-0000-0000-000000000006', 
    '80000000-0000-0000-0000-000000000006', 
    'COA-VAL-ACEH-006-B', now() - interval '5 days', 'Dr. Iskandar', 
    'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9', '/files/coa-aceh-006.pdf', 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=COA-VAL-ACEH-006-B'
  ),
  (
    '90000000-0000-0000-0000-000000000007', 
    '60000000-0000-0000-0000-000000000007', 
    '80000000-0000-0000-0000-000000000007', 
    'COA-VAL-ACEH-007-A', now() - interval '3 days', 'Dr. Iskandar', 
    'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9', '/files/coa-aceh-007.pdf', 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=COA-VAL-ACEH-007-A'
  ),
  (
    '90000000-0000-0000-0000-000000000008', 
    '60000000-0000-0000-0000-000000000008', 
    '80000000-0000-0000-0000-000000000008', 
    'COA-VAL-ACEH-008-C', now() - interval '8 days', 'Dr. Iskandar', 
    'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9', '/files/coa-aceh-008.pdf', 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=COA-VAL-ACEH-008-C'
  )
ON CONFLICT (product_id) DO NOTHING;


-- ── 11. Seed Trace Logs ───────────────────────────────────────

INSERT INTO trace_logs (
  id, product_id, event_type, location_name, location_district, gps_latitude, gps_longitude, description, event_date, created_at
)
VALUES
  -- VAL-ACEH-001 (Aceh Barat)
  ('a0000000-0000-0000-0000-000000000011', '60000000-0000-0000-0000-000000000001', 'HARVESTED', 'Kebun Nilam Meulaboh', 'Aceh Barat', 4.148, 96.128, 'Pemanenan daun nilam segar oleh Kelompok Tani Makmur.', now() - interval '15 days', now()),
  ('a0000000-0000-0000-0000-000000000012', '60000000-0000-0000-0000-000000000001', 'DISTILLED', 'Penyulingan Koperasi Nilam Jaya', 'Aceh Barat', 4.150, 96.130, 'Proses penyulingan uap 8 jam menggunakan ketel stainless steel.', now() - interval '12 days', now()),
  ('a0000000-0000-0000-0000-000000000013', '60000000-0000-0000-0000-000000000001', 'LAB_VERIFIED', 'Valam central QC Lab', 'Banda Aceh', 5.561, 95.318, 'Pengujian sampel dan penerbitan CoA Grade A.', now() - interval '9 days', now()),
  
  -- VAL-ACEH-002 (Aceh Jaya)
  ('a0000000-0000-0000-0000-000000000021', '60000000-0000-0000-0000-000000000002', 'HARVESTED', 'Kebun Nilam Calang', 'Aceh Jaya', 4.630, 95.590, 'Pemanenan daun nilam basah.', now() - interval '12 days', now()),
  ('a0000000-0000-0000-0000-000000000022', '60000000-0000-0000-0000-000000000002', 'DISTILLED', 'Penyulingan KUD Krueng Sabee', 'Aceh Jaya', 4.635, 95.595, 'Penyulingan tradisional yang diawasi tim kualitas Valam.', now() - interval '10 days', now()),
  ('a0000000-0000-0000-0000-000000000023', '60000000-0000-0000-0000-000000000002', 'LAB_VERIFIED', 'Valam central QC Lab', 'Banda Aceh', 5.561, 95.318, 'Pengujian sampel dan penerbitan CoA Grade B.', now() - interval '7 days', now()),

  -- VAL-ACEH-005 (Aceh Tengah)
  ('a0000000-0000-0000-0000-000000000051', '60000000-0000-0000-0000-000000000005', 'HARVESTED', 'Perkebunan Nilam Gayo Lut Tawar', 'Aceh Tengah', 3.618, 96.908, 'Panen daun nilam di lereng bukit Danau Lut Tawar.', now() - interval '8 days', now()),
  ('a0000000-0000-0000-0000-000000000052', '60000000-0000-0000-0000-000000000005', 'DISTILLED', 'Destilasi Kolektif Takengon', 'Aceh Tengah', 3.621, 96.902, 'Penyulingan menggunakan sistem ketel modern.', now() - interval '6 days', now()),
  ('a0000000-0000-0000-0000-000000000053', '60000000-0000-0000-0000-000000000005', 'LAB_VERIFIED', 'Valam central QC Lab', 'Banda Aceh', 5.561, 95.318, 'Verifikasi lab mandiri dan penerbitan sertifikat analisis.', now() - interval '4 days', now())
ON CONFLICT (id) DO NOTHING;

-- Mark premium products as featured
UPDATE products SET is_featured = true WHERE batch_code IN ('VAL-ACEH-001', 'VAL-ACEH-005');

