-- ============================================================
-- Valam Insights — Key Market / Quality / Supply Chain Articles
-- ============================================================
-- Idempotent: deletes then re-inserts by fixed UUIDs / slugs
-- ============================================================

-- ── Cleanup ──────────────────────────────────────────────────

DELETE FROM insights_content_tags WHERE content_id IN (
  'd1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'd2b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'd3b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'd4b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'd5b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'd6b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'd7b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'd8b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'd9b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'd0b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'
);

DELETE FROM insights_content_cta WHERE content_id IN (
  'd1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'd2b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'd3b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'd4b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'd5b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'd6b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'd7b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'd8b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'd9b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'd0b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'
);

DELETE FROM insights_content WHERE id IN (
  'd1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'd2b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'd3b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'd4b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'd5b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'd6b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'd7b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'd8b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'd9b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'd0b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'
);

-- Ensure editorial author + core tags exist
INSERT INTO insights_authors (id, name, avatar_url, role_label, bio_id, bio_en)
VALUES (
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'Tim Editorial Valam',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
  'Tim Valam',
  'Tim ahli konten dan riset pasar Valam.',
  'Valam content and market research team.'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO insights_tags (id, name, slug)
VALUES
  ('03b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Harga Pasar', 'harga-pasar'),
  ('04b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Standardisasi', 'standardisasi'),
  ('05b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Kisah Koperasi', 'kisah-koperasi'),
  ('01b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Budidaya', 'budidaya'),
  ('02b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Distilasi', 'distilasi')
ON CONFLICT (slug) DO NOTHING;


-- ── Articles ─────────────────────────────────────────────────

INSERT INTO insights_content (
  id, content_type, status, slug,
  title_id, title_en, excerpt_id, excerpt_en,
  body_id, body_en, cover_image_url,
  author_id, author_type, verified_badge, read_time_minutes, published_at
)
VALUES
-- 1. Featured market article
(
  'd1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'artikel', 'published',
  'harga-minyak-nilam-aceh-minggu-ini-tren-dan-faktor',
  'Harga Minyak Nilam Aceh Minggu Ini: Tren dan Faktor yang Mempengaruhinya',
  'Aceh Patchouli Oil Price This Week: Trends and Driving Factors',
  'Ringkasan tren harga minyak nilam Aceh minggu ini beserta faktor pasokan, permintaan, dan kualitas yang paling memengaruhi pergerakan pasar.',
  'A weekly summary of Aceh patchouli oil prices and the supply, demand, and quality factors that move the market.',
  E'# Harga Minyak Nilam Aceh Minggu Ini\n\nHarga minyak nilam Aceh bergerak mengikuti kombinasi **ketersediaan batch**, **kadar Patchouli Alcohol (PA)**, dan **permintaan buyer global**. Artikel ini merangkum tren minggu ini dan faktor yang perlu dipantau petani, penyuling, koperasi, serta buyer.\n\n## Ringkasan tren\n* Grade A (PA ≥ 30%) biasanya menjadi acuan harga premium.\n* Perubahan mingguan sering berada di kisaran kecil, kecuali ada gangguan panen atau lonjakan permintaan ekspor.\n* Harga di tingkat petani tidak selalu sama dengan harga FOB eksportir — ada biaya konsolidasi, lab, dan logistik di antaranya.\n\n## Faktor yang paling memengaruhi\n1. **Kualitas & CoA** — Batch dengan GC-MS lengkap dan PA tinggi lebih cepat terserap.\n2. **Stok di hulu** — Musim panen atau cuaca buruk mengubah volume daun dan minyak.\n3. **Permintaan fragrance & kosmetik** — Kontrak buyer Eropa/Asia bisa mengangkat harga sementara.\n4. **Nilai tukar & biaya kirim** — Mempengaruhi daya tawar buyer internasional.\n\n## Apa yang bisa Anda lakukan?\n* Pantau Market Snapshot di Valam Insights setiap minggu.\n* Bandingkan harga berdasarkan **grade + PA**, bukan hanya harga satuan.\n* Untuk buyer: gunakan marketplace Valam untuk melihat batch terverifikasi beserta CoA.',
  E'# Aceh Patchouli Oil Price This Week\n\nAceh patchouli oil prices move with **batch availability**, **Patchouli Alcohol (PA) levels**, and **global buyer demand**. This article summarizes this week''s trend and what farmers, distillers, cooperatives, and buyers should watch.\n\n## Trend snapshot\n* Grade A (PA ≥ 30%) is the usual premium reference.\n* Weekly moves are often modest unless harvest shocks or export demand spikes occur.\n* Farm-gate prices differ from exporter FOB prices due to consolidation, lab, and logistics costs.\n\n## Key drivers\n1. **Quality & CoA** — Batches with complete GC-MS and high PA clear faster.\n2. **Upstream stock** — Harvest season and weather change leaf and oil volume.\n3. **Fragrance & cosmetics demand** — EU/Asia contracts can lift prices temporarily.\n4. **FX & freight** — Affect international buyer bargaining power.\n\n## What to do next\n* Check Valam Insights Market Snapshot weekly.\n* Compare prices by **grade + PA**, not unit price alone.\n* Buyers: browse verified batches with CoA on the Valam marketplace.',
  'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&h=500&fit=crop',
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'admin', true, 6,
  now() - interval '1 hour'
),
-- 2
(
  'd2b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'artikel', 'published',
  'mengapa-harga-minyak-nilam-berubah-setiap-minggu',
  'Mengapa Harga Minyak Nilam Bisa Berubah Setiap Minggu?',
  'Why Can Patchouli Oil Prices Change Every Week?',
  'Penjelasan singkat mekanisme pasar: stok, kualitas batch, spekulasi lokal, dan siklus permintaan yang membuat harga nilam bergerak mingguan.',
  'A clear explanation of stock, batch quality, local speculation, and demand cycles that drive weekly patchouli price moves.',
  E'# Mengapa Harga Nilam Bergerak Mingguan?\n\nBanyak pelaku rantai pasok heran ketika harga berubah dalam hitungan hari. Pada komoditas minyak nilam, fluktuasi mingguan adalah **normal** karena pasar relatif tipis dan informasi kualitas tersebar tidak merata.\n\n## 1. Pasar yang tipis\nVolume transaksi mingguan terbatas. Satu kontrak besar buyer dapat menggeser harga lokal sementara.\n\n## 2. Kualitas batch tidak homogen\nBatch dengan PA 28% dan 32% tidak bisa dibandingkan langsung. Saat lebih banyak batch Grade A masuk pasar, harga acuan naik; sebaliknya stok Grade B/C menekan persepsi harga.\n\n## 3. Informasi dan tengkulak\nDi tingkat petani, harga sering ditentukan oleh informasi lokal. Keterlambatan info CoA membuat harga “mengambang” hingga lab keluar.\n\n## 4. Siklus panen & cuaca\nHujan berkepanjangan atau gagal panen di sentra Aceh mengubah ekspektasi pasokan dalam hitungan minggu.\n\n## Takeaway\nGunakan data tren mingguan sebagai **indikator**, bukan jaminan harga kontrak. Negosiasi RFQ tetap merujuk pada spesifikasi kimia dan volume.',
  E'# Why Do Patchouli Prices Move Weekly?\n\nWeekly moves are **normal** in patchouli because the market is relatively thin and quality information is uneven.\n\n## 1. Thin market\nLimited weekly volume means one large buyer contract can shift local prices temporarily.\n\n## 2. Uneven batch quality\n28% PA and 32% PA batches are not comparable. More Grade A supply lifts the reference; more B/C stock weighs on sentiment.\n\n## 3. Information gaps\nFarm-gate prices often follow local middleman signals. Delayed CoA keeps prices “floating” until lab results arrive.\n\n## 4. Harvest & weather cycles\nExtended rain or harvest failure in Aceh hubs changes supply expectations within weeks.\n\n## Takeaway\nTreat weekly trends as an **indicator**, not a contract guarantee. RFQ negotiation still hinges on chemical specs and volume.',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=500&fit=crop',
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'admin', true, 5,
  now() - interval '5 hours'
),
-- 3
(
  'd3b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'artikel', 'published',
  'harga-nilam-berdasarkan-kualitas-dan-kadar-pa',
  'Mengenal Harga Nilam Berdasarkan Kualitas dan Kadar Patchouli Alcohol',
  'Understanding Patchouli Prices by Quality and Patchouli Alcohol Content',
  'Bagaimana kadar PA, kelembapan, dan kemurnian menentukan grade harga minyak nilam dari Grade A hingga C.',
  'How PA level, moisture, and purity determine Grade A–C patchouli oil pricing.',
  E'# Harga Nilam vs Kualitas & PA\n\nDi pasar B2B, harga minyak nilam **bukan hanya soal volume**. Buyer membayar premium untuk spesifikasi kimia yang dapat diverifikasi.\n\n## Acuan grade umum\n| Grade | Kadar PA (indikatif) | Positioning |\n| --- | --- | --- |\n| **A** | ≥ 30% | Ekspor fragrance / premium |\n| **B** | 25–30% | Pasar regional / industri |\n| **C** | < 25% | Domestik / pengolahan lanjut |\n\n## Parameter lain yang memengaruhi harga\n* **Moisture** — Kadar air tinggi menurunkan daya simpan dan harga.\n* **Fe / logam** — Kontaminasi ketel besi membuat minyak gelap dan ditolak buyer kosmetik.\n* **Kelengkapan CoA** — Tanpa GC-MS, batch sulit masuk kontrak global.\n\n## Tip untuk petani & koperasi\nInvestasi uji lab sering terbayar lewat kenaikan grade. Satu lonjakan PA 2–3 poin dapat menggeser batch dari B ke A.\n\n## Tip untuk buyer\nBandingkan **harga per kg ÷ nilai PA**, bukan harga nominal saja.',
  E'# Patchouli Price vs Quality & PA\n\nIn B2B trade, patchouli price is **not volume-only**. Buyers pay premiums for verifiable chemistry.\n\n## Common grade guide\n| Grade | Indicative PA | Positioning |\n| --- | --- | --- |\n| **A** | ≥ 30% | Fragrance / premium export |\n| **B** | 25–30% | Regional / industrial |\n| **C** | < 25% | Domestic / further processing |\n\n## Other price drivers\n* **Moisture** — High water content hurts shelf life and price.\n* **Iron / metals** — Iron boiler contamination darkens oil and leads to rejection.\n* **Complete CoA** — Without GC-MS, global contracts are hard to win.\n\n## For farmers & co-ops\nLab investment often pays back via grade upgrades. A 2–3 point PA lift can move a batch from B to A.\n\n## For buyers\nCompare **price per kg ÷ PA value**, not nominal price alone.',
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&h=500&fit=crop',
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'admin', true, 5,
  now() - interval '8 hours'
),
-- 4
(
  'd4b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'artikel', 'published',
  'tren-permintaan-minyak-nilam-aceh-pasar-global',
  'Tren Permintaan Minyak Nilam Aceh di Pasar Global',
  'Global Demand Trends for Aceh Patchouli Oil',
  'Permintaan fragrance houses, kosmetik natural, dan buyer Asia terhadap minyak nilam Aceh — serta implikasinya bagi supplier lokal.',
  'How fragrance houses, natural cosmetics, and Asian buyers are shaping demand for Aceh patchouli — and what local suppliers should prepare.',
  E'# Tren Permintaan Global Minyak Nilam Aceh\n\nAceh dikenal sebagai salah satu sentra minyak nilam berkualitas tinggi di dunia. Permintaan global saat ini didorong tiga segmen utama.\n\n## 1. Fragrance houses\nParfum mewah membutuhkan PA tinggi dan profil aroma stabil. Kontrak cenderung jangka menengah dengan syarat CoA + traceability.\n\n## 2. Kosmetik & personal care natural\nBrand natural mencari klaim *sustainable sourcing*. Batch organik atau tumpang sari sering mendapat premium.\n\n## 3. Buyer Asia & Timur Tengah\nVolume lebih fleksibel pada grade B, tetapi kompetisi harga lebih ketat.\n\n## Implikasi untuk ekosistem Valam\n* Supplier perlu siap dokumen: CoA, MSDS, dan data asal kebun.\n* Buyer global semakin menolak minyak tanpa ketertelusuran.\n* Koperasi yang mengonsolidasikan kualitas akan lebih mudah masuk kontrak ekspor.\n\nPantau Insights Valam untuk update tren permintaan per kuartal.',
  E'# Global Demand Trends for Aceh Patchouli\n\nAceh is a key origin for high-quality patchouli oil. Global demand is driven by three main segments.\n\n## 1. Fragrance houses\nLuxury perfume needs high PA and stable aroma profiles. Contracts often require CoA + traceability.\n\n## 2. Natural cosmetics & personal care\nNatural brands seek sustainable sourcing claims. Organic or intercropped batches often earn premiums.\n\n## 3. Asian & Middle East buyers\nMore flexible on Grade B, but price competition is tighter.\n\n## Implications for the Valam ecosystem\n* Suppliers need CoA, MSDS, and farm-origin data ready.\n* Global buyers increasingly reject untraceable oil.\n* Cooperatives that consolidate quality win export contracts more easily.\n\nFollow Valam Insights for quarterly demand updates.',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=500&fit=crop',
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'admin', true, 5,
  now() - interval '12 hours'
),
-- 5
(
  'd5b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'artikel', 'published',
  'faktor-harga-minyak-nilam-tingkat-petani',
  'Apa yang Mempengaruhi Harga Minyak Nilam di Tingkat Petani?',
  'What Affects Patchouli Oil Prices at the Farm Gate?',
  'Dari kualitas daun, jarak ke penyulingan, hingga posisi tawar petani terhadap tengkulak dan koperasi — faktor pembentuk harga di hulu.',
  'From leaf quality and distance to distillation, to bargaining power versus middlemen and cooperatives — what shapes farm-gate prices.',
  E'# Harga di Tingkat Petani\n\nHarga yang diterima petani sering berbeda jauh dari harga ekspor. Memahami rantai nilai membantu petani dan koperasi menegosiasikan harga yang lebih adil.\n\n## Faktor utama\n1. **Kualitas daun & kadar minyak** — Daun layu/kering optimal menghasilkan rendemen lebih baik.\n2. **Akses ke penyulingan** — Jarak dan biaya transport menurunkan harga bersih petani.\n3. **Modal & ketergantungan tengkulak** — Ikatan ijon menekan daya tawar.\n4. **Transparansi kadar PA** — Tanpa uji lab, petani sulit membuktikan kualitas premium.\n5. **Konsolidasi koperasi** — Volume kolektif biasanya mendapat harga lebih baik.\n\n## Peran Valam\nPlatform Valam mendorong harga berbasis data kualitas, bukan spekulasi sepihak. Petani yang bergabung lewat koperasi terverifikasi dapat melihat status batch dan pembayaran escrow secara transparan.',
  E'# Farm-Gate Patchouli Prices\n\nFarmers often receive prices far below export levels. Understanding the value chain helps negotiate fairer outcomes.\n\n## Main factors\n1. **Leaf quality & oil yield** — Properly wilted/dried leaves improve recovery.\n2. **Access to distillation** — Distance and transport cut net farm income.\n3. **Capital & middleman ties** — Advance-payment dependencies weaken bargaining power.\n4. **PA transparency** — Without lab tests, farmers struggle to prove premium quality.\n5. **Cooperative consolidation** — Collective volume usually earns better prices.\n\n## Valam''s role\nValam pushes quality-data pricing instead of opaque speculation. Farmers via verified cooperatives can track batch status and escrow payouts transparently.',
  'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&h=500&fit=crop',
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'admin', true, 5,
  now() - interval '18 hours'
),
-- 6
(
  'd6b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'panduan', 'published',
  'apa-itu-patchouli-alcohol-dan-mengapa-penting',
  'Apa Itu Patchouli Alcohol dan Mengapa Penting bagi Buyer?',
  'What Is Patchouli Alcohol and Why Does It Matter to Buyers?',
  'Penjelasan ringkas senyawa PA: peran dalam aroma, standar buyer global, dan kaitannya dengan harga serta grade minyak nilam.',
  'A concise guide to PA: its role in aroma, global buyer standards, and how it links to patchouli oil price and grade.',
  E'# Apa Itu Patchouli Alcohol (PA)?\n\n**Patchouli Alcohol** adalah senyawa seskuiterpen alkohol utama dalam minyak nilam. PA memberi karakter aroma *woody-earthy* yang tahan lama — alasan utama industri parfum membelinya.\n\n## Mengapa buyer peduli?\n* PA menentukan **kekuatan fixative** dalam formula fragrance.\n* Spesifikasi kontrak global biasanya mensyaratkan PA minimal **30%**.\n* PA tinggi = risiko rejection lebih rendah di pelabuhan tujuan.\n\n## Bagaimana PA diukur?\nMelalui analisis **GC-MS**. Hasilnya tercantum di Certificate of Analysis (CoA) setiap batch di Valam.\n\n## Hubungan PA dan harga\nSemakin tinggi PA (dengan parameter lain tetap baik), semakin tinggi peluang harga Grade A. Namun PA saja tidak cukup — moisture dan kemurnian tetap dicek.',
  E'# What Is Patchouli Alcohol (PA)?\n\n**Patchouli Alcohol** is the main sesquiterpene alcohol in patchouli oil. It delivers the lasting woody-earthy character fragrance houses buy for.\n\n## Why buyers care\n* PA drives **fixative strength** in fragrance formulas.\n* Global contracts often require minimum **30%** PA.\n* Higher PA lowers rejection risk at destination ports.\n\n## How PA is measured\nVia **GC-MS** analysis, listed on each batch Certificate of Analysis (CoA) on Valam.\n\n## PA and price\nHigher PA (with other parameters healthy) improves Grade A pricing odds. PA alone is not enough — moisture and purity still matter.',
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&h=500&fit=crop',
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'admin', true, 4,
  now() - interval '1 day'
),
-- 7
(
  'd7b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'panduan', 'published',
  'bagaimana-gcms-menentukan-kualitas-minyak-nilam',
  'Bagaimana GC-MS Menentukan Kualitas Minyak Nilam?',
  'How Does GC-MS Determine Patchouli Oil Quality?',
  'Cara kerja GC-MS dalam memverifikasi kemurnian, mendeteksi adulterasi, dan menetapkan parameter kualitas yang dipakai buyer B2B.',
  'How GC-MS verifies purity, detects adulteration, and sets the quality parameters B2B buyers rely on.',
  E'# GC-MS dan Kualitas Minyak Nilam\n\n**Gas Chromatography–Mass Spectrometry (GC-MS)** adalah standar emas pengujian minyak nilam di perdagangan internasional.\n\n## Apa yang dibaca GC-MS?\n* Komposisi relatif senyawa (termasuk PA, patchoulene, seychellene).\n* Keberadaan zat asing / adulteran (mis. minyak mineral, phthalate).\n* Konsistensi profil kimia antar batch.\n\n## Alur di Valam\n1. Supplier mengirim sampel batch.\n2. Lab mitra menjalankan GC-MS.\n3. Hasil masuk ke CoA digital yang ditampilkan di product card.\n4. Buyer memverifikasi sebelum RFQ / checkout.\n\n## Kesalahan umum\nMengandalkan bau dan warna saja **tidak cukup**. Adulterasi modern sering lolos uji organoleptik tetapi gagal di GC-MS.',
  E'# GC-MS and Patchouli Quality\n\n**Gas Chromatography–Mass Spectrometry (GC-MS)** is the gold standard in international patchouli trade.\n\n## What GC-MS reads\n* Relative compound composition (including PA, patchoulenes, seychellene).\n* Foreign / adulterant peaks (e.g. mineral oil, phthalates).\n* Batch-to-batch chemical consistency.\n\n## Flow on Valam\n1. Supplier submits a batch sample.\n2. Partner lab runs GC-MS.\n3. Results feed a digital CoA on the product card.\n4. Buyers verify before RFQ / checkout.\n\n## Common mistake\nRelying on smell and color alone is **not enough**. Modern adulteration often passes organoleptic checks but fails GC-MS.',
  'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&h=500&fit=crop',
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'admin', true, 5,
  now() - interval '30 hours'
),
-- 8
(
  'd8b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'artikel', 'published',
  'dari-kebun-hingga-buyer-perjalanan-batch-nilam',
  'Dari Kebun hingga Buyer: Perjalanan Satu Batch Minyak Nilam',
  'From Farm to Buyer: The Journey of One Patchouli Oil Batch',
  'Menelusuri perjalanan satu batch: panen, pelayuan, distilasi, uji lab, listing marketplace, hingga pengiriman ke buyer.',
  'Follow one batch from harvest and distillation through lab testing, marketplace listing, and delivery to the buyer.',
  E'# Perjalanan Satu Batch Minyak Nilam\n\nTransparansi rantai pasok dimulai dari memahami setiap tahap batch.\n\n## 1. Kebun\nPetani memanen daun pada usia optimal (sekitar 6–8 bulan), lalu melayukan/mengeringkan dengan benar.\n\n## 2. Penyulingan\nDaun disuling (biasanya uap) di fasilitas koperasi atau penyuling lokal. Material ketel dan durasi sangat memengaruhi PA.\n\n## 3. QC & Lab\nSampel diuji GC-MS. Hasil menjadi dasar grade dan harga.\n\n## 4. Listing di Valam\nBatch terverifikasi dipublikasikan dengan CoA, stok, dan data asal.\n\n## 5. Transaksi & kirim\nBuyer memesan lewat marketplace/RFQ. Pembayaran escrow melindungi kedua pihak hingga barang diterima.\n\nMemahami alur ini membantu setiap aktor tahu di mana nilai — dan risiko — terbentuk.',
  E'# Journey of One Patchouli Batch\n\nSupply-chain transparency starts with understanding each stage.\n\n## 1. Farm\nFarmers harvest at optimal age (~6–8 months), then wilt/dry correctly.\n\n## 2. Distillation\nLeaves are steam-distilled at a co-op or local facility. Boiler material and duration heavily affect PA.\n\n## 3. QC & lab\nSamples undergo GC-MS. Results set grade and price.\n\n## 4. Listing on Valam\nVerified batches publish with CoA, stock, and origin data.\n\n## 5. Trade & ship\nBuyers order via marketplace/RFQ. Escrow protects both sides until delivery confirmation.\n\nKnowing this flow shows every actor where value — and risk — are created.',
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=500&fit=crop',
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'admin', true, 5,
  now() - interval '36 hours'
),
-- 9
(
  'd9b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'cerita_koperasi', 'published',
  'peran-koperasi-dalam-rantai-pasok-minyak-nilam',
  'Peran Koperasi dalam Rantai Pasok Minyak Nilam',
  'The Role of Cooperatives in the Patchouli Oil Supply Chain',
  'Mengapa koperasi menjadi penghubung kritis antara petani, penyuling, dan buyer — dari konsolidasi kualitas hingga akses pasar yang lebih adil.',
  'Why cooperatives are the critical link between farmers, distillers, and buyers — from quality consolidation to fairer market access.',
  E'# Peran Koperasi di Rantai Pasok Nilam\n\nKoperasi atsiri bukan sekadar pengumpul. Mereka adalah **infrastruktur kepercayaan** di hulu.\n\n## Fungsi utama\n* **Konsolidasi volume** — Menggabungkan hasil petani kecil agar memenuhi MOQ buyer.\n* **Standarisasi proses** — Menyeragamkan pelayuan, distilasi, dan pengemasan.\n* **Akses lab & dokumen** — Mengurus CoA kolektif yang mahal jika dilakukan sendiri-sendiri.\n* **Negosiasi harga** — Daya tawar lebih kuat dibanding petani individu.\n\n## Tantangan yang masih ada\nTata kelola, modal kerja, dan literasi digital. Platform seperti Valam membantu koperasi mempublikasikan batch terverifikasi ke buyer yang lebih luas.\n\n## Kesimpulan\nRantai pasok yang adil membutuhkan koperasi yang kuat, transparan, dan terhubung digital.',
  E'# Cooperatives in the Patchouli Supply Chain\n\nEssential-oil cooperatives are more than aggregators. They are upstream **trust infrastructure**.\n\n## Core roles\n* **Volume consolidation** — Pooling smallholder output to meet buyer MOQs.\n* **Process standardization** — Aligning wilting, distillation, and packing.\n* **Lab & document access** — Shared CoA costs that individuals cannot bear alone.\n* **Price negotiation** — Stronger bargaining power than solo farmers.\n\n## Remaining challenges\nGovernance, working capital, and digital literacy. Platforms like Valam help co-ops publish verified batches to a wider buyer base.\n\n## Bottom line\nA fair supply chain needs strong, transparent, digitally connected cooperatives.',
  'https://images.unsplash.com/photo-1500937386664-56d7fcbbeabc?w=800&h=500&fit=crop',
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'admin', true, 4,
  now() - interval '2 days'
),
-- 10
(
  'd0b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'panduan', 'published',
  'qr-traceability-valam-verifikasi-produk',
  'Bagaimana QR Traceability VALAM Membantu Buyer Memverifikasi Produk?',
  'How VALAM QR Traceability Helps Buyers Verify Products',
  'Penjelasan fitur QR ketertelusuran Valam: apa yang bisa diverifikasi buyer, mengapa penting untuk compliance, dan cara membacanya.',
  'How Valam QR traceability works: what buyers can verify, why it matters for compliance, and how to read a batch QR.',
  E'# QR Traceability Valam untuk Buyer\n\nBuyer global membutuhkan bukti asal-usul bahan baku — terutama untuk audit ESG dan regulasi seperti EUDR. **QR Traceability Valam** menghubungkan setiap batch ke data kebun, proses, dan hasil lab.\n\n## Apa yang bisa diverifikasi?\n* Identitas batch dan status verifikasi.\n* Ringkasan parameter CoA (termasuk PA).\n* Informasi supplier / koperasi terkait.\n* Jejak asal (koordinat / wilayah kebun, jika tersedia).\n\n## Mengapa penting?\n* Mengurangi risiko minyak oplosan atau batch tidak terdokumentasi.\n* Mempercepat due diligence procurement.\n* Membangun kepercayaan tanpa bergantung pada klaim teks semata.\n\n## Cara praktis\nScan QR pada kemasan atau buka halaman traceability publik dari product card Valam sebelum checkout / kontrak.\n\nTransparansi data adalah fondasi marketplace B2B yang sehat.',
  E'# Valam QR Traceability for Buyers\n\nGlobal buyers need proof of origin — especially for ESG audits and rules like EUDR. **Valam QR Traceability** links each batch to farm, process, and lab data.\n\n## What you can verify\n* Batch identity and verification status.\n* CoA parameter summary (including PA).\n* Related supplier / cooperative information.\n* Origin trail (coordinates / farm region when available).\n\n## Why it matters\n* Lowers risk of adulterated or undocumented oil.\n* Speeds procurement due diligence.\n* Builds trust beyond text claims alone.\n\n## Practical tip\nScan the pack QR or open the public traceability page from the Valam product card before checkout / contract.\n\nData transparency is the foundation of a healthy B2B marketplace.',
  'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=500&fit=crop',
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'admin', true, 4,
  now() - interval '3 days'
)
ON CONFLICT (slug) DO NOTHING;


-- ── Tags ─────────────────────────────────────────────────────
-- harga-pasar = 03..., standardisasi = 04..., kisah-koperasi = 05...,
-- budidaya = 01..., distilasi = 02...

INSERT INTO insights_content_tags (content_id, tag_id)
VALUES
  ('d1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '03b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  ('d2b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '03b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  ('d3b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '03b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  ('d3b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '04b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  ('d4b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '04b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  ('d5b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '03b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  ('d5b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '05b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  ('d6b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '04b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  ('d7b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '04b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  ('d8b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '01b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  ('d8b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '05b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  ('d9b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '05b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  ('d0b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '04b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  ('d0b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '05b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d')
ON CONFLICT (content_id, tag_id) DO NOTHING;


-- ── CTAs ─────────────────────────────────────────────────────

INSERT INTO insights_content_cta (id, content_id, label_id, label_en, target_url)
VALUES
  (
    'da11c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'd1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'Lihat Marketplace Minyak Nilam',
    'Browse Patchouli Marketplace',
    '/marketplace'
  ),
  (
    'da22c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'd6b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'Cari Batch dengan CoA Lengkap',
    'Find Batches with Full CoA',
    '/marketplace'
  ),
  (
    'da33c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'd0b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'Jelajahi Produk Terverifikasi',
    'Explore Verified Products',
    '/marketplace'
  )
ON CONFLICT (id) DO NOTHING;
