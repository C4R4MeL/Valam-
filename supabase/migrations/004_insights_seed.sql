-- ============================================================
-- Valam Insights — Seed Mock Data
-- ============================================================

-- ── 1. Clean Up Seeded Data to Prevent Conflict Skipping ─────

DELETE FROM insights_content_tags WHERE content_id IN (
  'c1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'c2b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'c3b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'c4b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'c5b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'c6b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'c7b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'c8b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'c9b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'
);

DELETE FROM insights_content_cta WHERE content_id IN (
  'c1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'c2b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'c3b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'c4b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'c5b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'c6b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'c7b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'c8b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'c9b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'
);

DELETE FROM insights_content WHERE id IN (
  'c1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'c2b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'c3b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'c4b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'c5b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'c6b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'c7b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'c8b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'c9b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'
);

DELETE FROM insights_authors WHERE id IN (
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'f6e5d4c3-b2a1-0f9e-8d7c-6b5a4f3e2d1c',
  'b1e2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'
);

DELETE FROM insights_tags WHERE id IN (
  '01b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  '02b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  '03b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  '04b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  '05b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  '06b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  '07b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'
);

DELETE FROM insights_market_price_history;


-- ── 2. Seed Authors ──────────────────────────────────────────

INSERT INTO insights_authors (id, name, avatar_url, role_label, bio_id, bio_en)
VALUES
  (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'Tim Editorial Valam',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    'Tim Valam',
    'Tim ahli konten dan riset pasar Valam. Kami menyajikan informasi terpercaya untuk mendukung ekosistem nilam berkelanjutan.',
    'Valam content experts and market research team. We deliver trusted information to support a sustainable patchouli ecosystem.'
  ),
  (
    'f6e5d4c3-b2a1-0f9e-8d7c-6b5a4f3e2d1c',
    'Koperasi Nilam Jaya Aceh Barat',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    'Koperasi Terverifikasi',
    'Koperasi produsen minyak nilam dari Aceh Barat yang mengayomi lebih dari 150 petani lokal.',
    'Patchouli oil producer cooperative from West Aceh supporting over 150 local farmers.'
  ),
  (
    'b1e2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'Koperasi Produsen Atsiri Gayo',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    'Koperasi Terverifikasi',
    'Koperasi produsen atsiri dataran tinggi Gayo yang mempelopori budidaya nilam organik tumpang sari.',
    'Gayo highlands essential oil cooperative pioneering organic intercropped patchouli cultivation.'
  )
ON CONFLICT (id) DO NOTHING;


-- ── 3. Seed Tags ─────────────────────────────────────────────

INSERT INTO insights_tags (id, name, slug)
VALUES
  ('01b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Budidaya', 'budidaya'),
  ('02b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Distilasi', 'distilasi'),
  ('03b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Harga Pasar', 'harga-pasar'),
  ('04b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Standardisasi', 'standardisasi'),
  ('05b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Kisah Koperasi', 'kisah-koperasi'),
  ('06b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Nilam Organik', 'nilam-organik'),
  ('07b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Hama & Penyakit', 'hama-penyakit')
ON CONFLICT (slug) DO NOTHING;


-- ── 4. Seed Articles / Content ────────────────────────────────

INSERT INTO insights_content (
  id,
  content_type,
  status,
  slug,
  title_id,
  title_en,
  excerpt_id,
  excerpt_en,
  body_id,
  body_en,
  cover_image_url,
  author_id,
  author_type,
  verified_badge,
  read_time_minutes,
  published_at
)
VALUES
  (
    'c1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'panduan',
    'published',
    'panduan-meningkatkan-kadar-pa-nilam',
    'Panduan Lengkap Peningkatan Kadar Patchouli Alcohol (PA) Minyak Nilam',
    'Complete Guide to Increasing Patchouli Alcohol (PA) Levels in Patchouli Oil',
    'Ketahui faktor-faktor kunci dalam proses pemanenan, pengeringan, dan penyulingan daun nilam untuk menghasilkan kadar PA premium di atas 30%.',
    'Learn the key factors in harvesting, drying, and distilling patchouli leaves to produce premium PA levels above 30%.',
    E'# Panduan Praktis Meningkatkan Kadar PA\n\nPatchouli Alcohol (PA) adalah senyawa kimia utama yang menentukan kualitas dan aroma minyak nilam. Pembeli global biasanya mensyaratkan kadar PA minimal **30% hingga 32%**.\n\nBerikut adalah langkah-langkah kritis untuk memastikan kadar PA minyak nilam Anda memenuhi standar premium:\n\n## 1. Pemanenan yang Tepat\n* **Usia Panen:** Panenlah tanaman nilam pada usia optimal, yaitu sekitar **6 hingga 8 bulan** setelah penanaman. Memanen terlalu muda akan menghasilkan kadar minyak rendah dan kadar PA yang kurang matang.\n* **Waktu Panen:** Lakukan pemanenan pada pagi hari (pukul 07.00 - 10.00) sebelum sinar matahari terlalu terik untuk mencegah evaporasi minyak atsiri alami di daun.\n\n## 2. Proses Pelayuan dan Pengeringan\nJangan menjemur daun nilam langsung di bawah sinar matahari terik karena panas berlebih dapat merusak kandungan PA.\n* Hamparkan daun nilam di atas lantai bersih atau terpal di tempat yang teduh dengan sirkulasi udara baik (diangin-anginkan).\n* Proses ini memakan waktu **3 sampai 5 hari** hingga kadar air daun turun sekitar 12-15% (daun terasa gemerisik tetapi tidak hancur menjadi bubuk).\n\n## 3. Optimasi Penyulingan (Distilasi)\n* **Tekanan & Suhu:** Gunakan metode penyulingan uap langsung dengan tekanan stabil (1.5 - 2 bar) dan suhu berkisar antara **100°C - 105°C**.\n* **Durasi:** Pertahankan proses penyulingan minimal selama **6 hingga 8 jam**. Senyawa PA merupakan fraksi berat yang baru akan keluar secara optimal pada jam-jam terakhir penyulingan.\n* **Material Ketel:** Pastikan ketel penyulingan menggunakan bahan *Stainless Steel* (SS 304 atau SS 316). Ketel besi biasa dapat menyebabkan kontaminasi zat besi (Fe) yang menurunkan kejernihan minyak nilam.',
    E'# Practical Guide to Increasing PA Levels\n\nPatchouli Alcohol (PA) is the primary chemical compound that determines the quality and aroma of patchouli oil. Global buyers typically require a minimum PA content of **30% to 32%**.\n\nHere are the critical steps to ensure your patchouli oil meets premium PA standards:\n\n## 1. Proper Harvesting\n* **Harvest Age:** Harvest patchouli plants at their optimal age, around **6 to 8 months** after planting. Harvesting too early results in low oil yield and underdeveloped PA levels.\n* **Harvest Time:** Harvest in the morning (07:00 - 10:00 AM) before the sun gets too hot to prevent the evaporation of natural essential oils in the leaves.\n\n## 2. Wilting and Drying Process\nDo not dry patchouli leaves directly under intense sunlight, as excessive heat can degrade the PA content.\n* Spread the patchouli leaves on a clean floor or tarp in a shaded area with good air circulation.\n* This process takes **3 to 5 days** until the leaf moisture content drops to around 12-15% (leaves should rustle but not crumble into powder).\n\n## 3. Distillation Optimization\n* **Pressure & Temperature:** Use the direct steam distillation method with stable pressure (1.5 - 2 bar) and temperature ranging between **100°C - 105°C**.\n* **Duration:** Maintain the distillation process for at least **6 to 8 hours**. The PA compound is a heavy fraction that is only optimally extracted during the final hours of distillation.\n* **Boiler Material:** Ensure the distillation boiler is made of *Stainless Steel* (SS 304 or SS 316). Ordinary iron boilers can cause iron (Fe) contamination, which reduces the clarity of the patchouli oil.',
    'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&h=500&fit=crop',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'admin',
    'true',
    5,
    now() - interval '4 days'
  ),
  (
    'c2b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'artikel',
    'published',
    'standardisasi-ekspor-nilam-uni-eropa',
    'Memahami Standardisasi Ekspor Minyak Nilam untuk Pasar Uni Eropa',
    'Understanding Patchouli Oil Export Standardization for the EU Market',
    'Panduan praktis mengenai regulasi registrasi REACH, parameter Certificate of Analysis (CoA) yang diwajibkan, dan cara menghindari penolakan kargo di pelabuhan Eropa.',
    'A practical guide on REACH registration regulations, mandatory Certificate of Analysis (CoA) parameters, and how to avoid cargo rejection at European ports.',
    E'# Standardisasi Ekspor Nilam ke Uni Eropa\n\nUni Eropa adalah salah satu importir minyak nilam terbesar di dunia untuk industri parfum dan kosmetik mewah. Namun, masuk ke pasar ini memerlukan kepatuhan regulasi yang ketat.\n\n## 1. Regulasi REACH\nSetiap bahan kimia—termasuk minyak esensial alami seperti minyak nilam—yang diekspor ke Uni Eropa dalam jumlah di atas 1 ton per tahun wajib terdaftar di bawah **REACH (Registration, Evaluation, Authorisation and Restriction of Chemicals)**.\n* Eksportir Indonesia biasanya menggunakan jasa *Only Representative* (OR) yang berbasis di Eropa untuk mengurus pendaftaran ini.\n* Pastikan koperasi atau perusahaan eksportir Anda terafiliasi dengan pembeli yang memiliki registrasi REACH aktif.\n\n## 2. Parameter Analisis Laboratorium (CoA)\nHasil uji laboratorium mandiri (Certificate of Analysis) menggunakan kromatografi gas (GC-MS) harus menunjukkan rentang parameter standar berikut:\n\n| Parameter | Standar Batas Maksimum / Minimum |\n| --- | --- |\n| **Kadar Patchouli Alcohol (PA)** | Min. 30.0% |\n| **Kadar Air (Moisture)** | Max. 1.0% (Mencegah ketengikan) |\n| **Kadar Zat Besi (Fe)** | Max. 20 ppm (Menghindari diskolorasi) |\n| **Putaran Optik (Optical Rotation)** | -48° s.d. -65° |\n| **Indeks Bias (Refractive Index)** | 1.505 s.d. 1.515 |\n\n## 3. Pengemasan Aman\nEkspor ke Eropa mewajibkan penggunaan wadah drum khusus berlapis *epoxy food grade* untuk mencegah reaksi kimia antara minyak nilam dengan dinding drum besi yang dapat meningkatkan kadar logam berat.',
    E'# Patchouli Oil Export Standardization to the EU\n\nThe European Union is one of the world\'s largest importers of patchouli oil for the luxury perfume and cosmetics industry. However, entering this market requires strict regulatory compliance.\n\n## 1. REACH Regulation\nEvery chemical substance—including natural essential oils like patchouli oil—exported to the EU in quantities exceeding 1 ton per year must be registered under **REACH (Registration, Evaluation, Authorisation and Restriction of Chemicals)**.\n* Indonesian exporters typically use the services of a Europe-based *Only Representative* (OR) to manage this registration.\n* Ensure your cooperative or exporting company is affiliated with a buyer who holds an active REACH registration.\n\n## 2. Laboratory Analysis Parameters (CoA)\nIndependent laboratory test results (Certificate of Analysis) using gas chromatography (GC-MS) must demonstrate the following standard parameter ranges:\n\n| Parameter | Standard Maximum / Minimum Limits |\n| --- | --- |\n| **Patchouli Alcohol (PA)** | Min. 30.0% |\n| **Moisture Content** | Max. 1.0% (Prevents rancidity) |\n| **Iron Content (Fe)** | Max. 20 ppm (Avoids discoloration) |\n| **Optical Rotation** | -48° to -65° |\n| **Refractive Index** | 1.505 to 1.515 |\n\n## 3. Secure Packaging\nExporting to Europe requires the use of specialized drums coated with *food-grade epoxy* to prevent chemical reactions between the patchouli oil and the metal drum walls, which can increase heavy metal content.',
    'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&h=500&fit=crop',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'admin',
    'true',
    6,
    now() - interval '3 days'
  ),
  (
    'c3b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'cerita_koperasi',
    'published',
    'kisah-sukses-koperasi-nilam-jaya',
    'Bagaimana Koperasi Nilam Jaya Aceh Barat Menembus Pasar Global B2B',
    'How West Aceh''s Nilam Jaya Cooperative Broke into the Global B2B Market',
    'Kisah inspiratif para petani nilam lokal dalam mengorganisir distilasi kolektif dan memanfaatkan platform digital Valam untuk mendapatkan harga yang adil.',
    'An inspiring story of local patchouli farmers organizing collective distillation and leveraging the Valam digital platform to secure fair pricing.',
    E'# Langkah Koperasi Nilam Jaya ke Kancah Internasional\n\nSelama bertahun-tahun, petani nilam di Aceh Barat terjebak dalam rantai tengkulak tradisional yang tidak transparan. Spesifikasi kadar PA sering kali dinilai secara sepihak dengan harga beli yang sangat murah.\n\n## 1. Konsolidasi Petani\nPada tahun 2024, Koperasi Nilam Jaya didirikan untuk mengonsolidasikan hasil panen daun nilam dari **150+ petani**. Koperasi membangun fasilitas penyulingan uap modern bersama menggunakan bahan stainless steel untuk menjaga kualitas.\n\n## 2. Uji Lab Mandiri\nDengan beralih dari penilaian tradisional ke pengujian laboratorium bersertifikat, koperasi mampu membuktikan bahwa produk mereka secara konsisten memiliki kadar PA di atas **31.5%**.\n\n## 3. Transaksi Digital Lewat Valam\nMelalui platform B2B Valam, Koperasi Nilam Jaya mempublikasikan Certificate of Analysis (CoA) secara transparan ke pasar digital. Hasilnya:\n* **Harga Adil:** Koperasi mendapatkan kenaikan harga jual rata-rata sebesar **25%** dibandingkan saat menjual ke tengkulak.\n* **Pembayaran Aman:** Pembayaran langsung diverifikasi dan ditransfer secara aman melalui sistem escrow Valam, memberikan kepastian modal untuk panen berikutnya.',
    E'# Cooperative Steps to the International Stage\n\nFor years, patchouli farmers in West Aceh were trapped in traditional, non-transparent middleman networks. PA levels were often assessed unilaterally, resulting in low buying prices.\n\n## 1. Farmer Consolidation\nIn 2024, the Nilam Jaya Cooperative was established to consolidate patchouli leaf harvests from **150+ farmers**. The cooperative built a modern, shared steam distillation facility using stainless steel to maintain quality.\n\n## 2. Independent Lab Testing\nBy transitioning from traditional assessments to certified laboratory testing, the cooperative proved that their product consistently achieved PA levels above **31.5%**.\n\n## 3. Digital Transactions via Valam\nThrough the Valam B2B platform, the Nilam Jaya Cooperative published its Certificate of Analysis (CoA) transparently to the digital marketplace. The results:\n* **Fair Prices:** The cooperative secured an average price increase of **25%** compared to selling to traditional middlemen.\n* **Secure Payment:** Transactions are verified and transferred securely via the Valam escrow system, providing financial predictability for the next harvest season.',
    'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&h=500&fit=crop',
    'f6e5d4c3-b2a1-0f9e-8d7c-6b5a4f3e2d1c',
    'koperasi_terverifikasi',
    'true',
    4,
    now() - interval '2 days'
  ),
  (
    'c4b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'panduan',
    'published',
    'panduan-pemeliharaan-nilam-dari-hama-layu-bakteri',
    'Panduan Pengendalian Hama Utama dan Penyakit Layu Bakteri pada Tanaman Nilam',
    'Guide to Controlling Key Pests and Bacterial Wilt Disease in Patchouli Plants',
    'Cara efektif mengidentifikasi, mencegah, dan mengobati infeksi Layu Bakteri (Ralstonia) serta serangan hama Budok untuk melindungi investasi pertanian Anda.',
    'Effective ways to identify, prevent, and treat Bacterial Wilt (Ralstonia) infections and Budok pest attacks to protect your agricultural investment.',
    E'# Pengendalian Layu Bakteri & Hama Nilam\n\nTantangan terbesar dalam budidaya nilam adalah serangan hama dan patogen tanaman yang dapat merusak kualitas daun serta menurunkan kadar minyak atsiri secara drastis.\n\n## 1. Penyakit Layu Bakteri (Ralstonia solanacearum)\nPenyakit ini sangat ditakuti karena tanaman nilam dapat layu secara tiba-tiba dalam hitungan hari sementara daunnya tetap berwarna hijau.\n* **Gejala:** Daun layu mulai dari pucuk, diikuti oleh seluruh tanaman. Jika batang dipotong, akan keluar cairan keruh berlendir.\n* **Pencegahan:** \n  * Gunakan bibit unggul bersertifikat bebas penyakit.\n  * Terapkan sanitasi lahan yang ketat dan buat drainase air yang baik agar lahan tidak tergenang.\n  * Gunakan agen hayati seperti *Trichoderma harzianum* pada pupuk dasar sebelum menanam.\n\n## 2. Penyakit Budok (Penyakit Kerdil & Daun Mengerut)\nPenyakit ini disebabkan oleh virus atau jamur *Synchytrium pogostemonis* yang menyebabkan daun mengerut, tebal, berkeriput, dan tanaman menjadi kerdil.\n* **Pencegahan:** \n  * Segera cabut dan bakar tanaman yang terinfeksi agar tidak menular ke tanaman sehat.\n  * Semprotkan fungisida organik secara berkala pada musim hujan.\n  * Hindari pemangkasan daun menggunakan alat potong yang sama dari tanaman sakit ke tanaman sehat tanpa disterilisasi.',
    E'# Control of Bacterial Wilt & Pests in Patchouli\n\nThe biggest challenges in patchouli cultivation are pest attacks and plant pathogens that can degrade leaf quality and drastically reduce essential oil yields.\n\n## 1. Bacterial Wilt Disease (Ralstonia solanacearum)\nThis disease is highly feared because patchouli plants can wilt suddenly within days while the leaves remain green.\n* **Symptoms:** Leaves wilt starting from the shoots, followed by the entire plant. If the stem is cut, a cloudy, slimy exudate will flow.\n* **Prevention:**\n  * Use certified disease-free premium seedlings.\n  * Apply strict field sanitation and establish good water drainage to prevent soil waterlogging.\n  * Introduce biological agents like *Trichoderma harzianum* into the base fertilizer before planting.\n\n## 2. Budok Disease (Stunting & Leaf Curling)\nThis disease is caused by viruses or the fungus *Synchytrium pogostemonis*, causing leaves to curl, thicken, wrinkle, and leading to stunted growth.\n* **Prevention:**\n  * Promptly uproot and burn infected plants to prevent transmission to healthy ones.\n  * Spray organic fungicides periodically during the rainy season.\n  * Avoid pruning leaves using the same tools from damaged to healthy plants without prior sterilization.',
    'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&h=500&fit=crop',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'admin',
    'true',
    5,
    now() - interval '1 days'
  ),
  (
    'c5b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'artikel',
    'published',
    'peran-gcms-pengujian-kemurnian-minyak-atsiri',
    'Peran Penting Analisis GC-MS dalam Pengujian Kemurnian Minyak Nilam',
    'The Vital Role of GC-MS Analysis in Testing Patchouli Oil Purity',
    'Mengenal teknologi Kromatografi Gas - Spektrometri Massa (GC-MS) sebagai standar emas pendeteksian zat pemalsu dan penjamin kualitas ekspor minyak nilam.',
    'Understanding Gas Chromatography-Mass Spectrometry (GC-MS) technology as the gold standard for detecting adulterants and guaranteeing patchouli oil export quality.',
    E'# Mengenal Analisis Laboratorium GC-MS\n\nDalam perdagangan internasional B2B minyak nilam, Certificate of Analysis (CoA) yang berbasis pengujian **Gas Chromatography-Mass Spectrometry (GC-MS)** adalah dokumen wajib yang diminta oleh pembeli global.\n\n## 1. Mengapa GC-MS Suku Penting?\nMinyak nilam rentan terhadap pemalsuan (adulterasi) menggunakan minyak tanah, minyak kelapa, atau fraksi minyak atsiri murah lainnya untuk meningkatkan volume.\n* Uji organoleptik (indra penciuman dan penglihatan) saja tidak cukup mendeteksi pemalsuan tingkat tinggi.\n* GC-MS bekerja dengan memisahkan komponen kimia minyak nilam (Kromatografi Gas) lalu mengidentifikasi massa molekul masing-masing senyawa secara akurat (Spektrometri Massa).\n\n## 2. Membaca Komposisi Kimia Utama\nMinyak nilam murni yang bermutu tinggi harus menunjukkan senyawa dominan berikut dalam grafik GC-MS:\n* **Patchouli Alcohol (PA):** Minimal 30.0% (senyawa aktif utama pemberi aroma tahan lama).\n* **Pogostol:** 1.0% - 2.5%.\n* **Patchoulene (Alpha, Beta, Gamma):** Senyawa hidrokarbon seskuiterpen alami.\n* **Seychellene:** Komponen penting lainnya yang melengkapi profil aroma nilam asli.\n\nJika dalam laporan GC-MS terdeteksi adanya puncak (*peak*) zat asing seperti *diethyl phthalate* (DEP) or minyak mineral, kargo minyak nilam tersebut dipastikan akan ditolak oleh pembeli parfum kosmetik.',
    E'# Understanding GC-MS Laboratory Analysis\n\nIn international B2B patchouli oil trade, a Certificate of Analysis (CoA) based on **Gas Chromatography-Mass Spectrometry (GC-MS)** testing is a mandatory document requested by global buyers.\n\n## 1. Why is GC-MS Critical?\nPatchouli oil is highly susceptible to adulteration using kerosene, coconut oil, or other cheap essential oil fractions to inflate volume.\n* Organoleptic tests (smell and sight) are insufficient to detect advanced adulteration.\n* GC-MS works by separating the chemical components of patchouli oil (Gas Chromatography) and then accurately identifying the molecular mass of each compound (Mass Spectrometry).\n\n## 2. Reading Key Chemical Composition\nHigh-quality pure patchouli oil must exhibit the following dominant compounds in the GC-MS chromatogram:\n* **Patchouli Alcohol (PA):** Minimum 30.0% (the main active compound providing the long-lasting fixative scent).\n* **Pogostol:** 1.0% - 2.5%.\n* **Patchoulenes (Alpha, Beta, Gamma):** Natural sesquiterpene hydrocarbon compounds.\n* **Seychellene:** Another key component that completes the genuine patchouli aroma profile.\n\nIf the GC-MS report detects foreign peaks like *diethyl phthalate* (DEP) or mineral oils, the patchouli oil shipment will be rejected by cosmetics and perfumery buyers.',
    'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&h=500&fit=crop',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'admin',
    'true',
    6,
    now() - interval '12 hours'
  ),
  (
    'c6b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'cerita_koperasi',
    'published',
    'kisah-sukses-koperasi-atsiri-gayo-nilam-organik',
    'Kisah Sukses Koperasi Atsiri Gayo: Menembus Pasar Global dengan Nilam Organik',
    'Success Story of Atsiri Gayo Cooperative: Entering the Global Market with Organic Patchouli',
    'Bagaimana petani dataran tinggi Gayo mengintegrasikan kebun kopi dengan budidaya nilam organik tumpang sari bernilai jual premium di platform Valam.',
    'How Gayo highland farmers integrated coffee plantations with premium organic intercropped patchouli cultivation on the Valam platform.',
    E'# Inovasi Tumpang Sari Nilam Organik di Tanah Gayo\n\nKabupaten Aceh Tengah (Gayo) terkenal dengan kopi arabika premiumnya. Namun, Koperasi Produsen Atsiri Gayo melihat potensi luar biasa dengan mengintegrasikan tanaman nilam di sela-sela pohon kopi (sistem tumpang sari).\n\n## 1. Pertanian Bebas Kimia Sintetis\nKarena ditanam berdampingan dengan kopi arabika organik, nilam Gayo dibudidayakan tanpa pupuk kimia sintetis maupun pestisida kimia.\n* Tanah vulkanis subur yang kaya unsur hara menghasilkan minyak nilam dengan aroma herbal kayu yang sangat pekat.\n* Kadar PA yang dihasilkan secara konsisten mencapai **33% hingga 34%**, jauh melampaui rata-rata standar pasar ekspor.\n\n## 2. Kualitas Premium di Platform Valam\nMelalui transparansi data uji lab QC Valam, Koperasi Atsiri Gayo berhasil mencatatkan rekor harga jual tertinggi:\n* **Harga Premium:** Minyak nilam organik mereka dihargai **Rp840.000 per Kg**, lebih tinggi dibandingkan nilam non-organik.\n* **Pembeli Loyal:** Kontrak suplai langsung diperoleh dari pembeli kosmetik organik asal Perancis yang mencari produk bersertifikasi ramah lingkungan.',
    E'# Organic Intercropped Patchouli Innovation in Gayo\n\nCentral Aceh (Gayo) is famous for its premium Arabica coffee. However, the Atsiri Gayo Cooperative saw incredible potential by integrating patchouli plants between coffee trees (intercropping system).\n\n## 1. Synthesis Chemical-Free Farming\nBecause it is grown alongside organic Arabica coffee, Gayo patchouli is cultivated without synthetic chemical fertilizers or chemical pesticides.\n* Rich, fertile volcanic soils produce patchouli oil with a highly intense woody herbal aroma profile.\n* The resulting PA levels consistently reach **33% to 34%**, far exceeding average export market standards.\n\n## 2. Premium Quality on the Valam Platform\nThrough the transparent QC lab test data on Valam, the Atsiri Gayo Cooperative successfully recorded the highest selling prices:\n* **Premium Pricing:** Their organic patchouli oil is priced at **IDR 840,000 per Kg**, higher than conventional patchouli.\n* **Loyal Buyers:** Direct supply contracts were secured with organic cosmetics buyers from France looking for eco-certified products.',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=500&fit=crop',
    'b1e2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'koperasi_terverifikasi',
    true,
    4,
    now()
  ),
  (
    'c7b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'panduan',
    'published',
    'panduan-praktis-pembibitan-nilam-stek',
    'Panduan Praktis Pembibitan Nilam Unggul Teknik Stek untuk Petani Lokal',
    'Practical Guide to Patchouli Seedling Cultivation Using Stem Cuttings',
    'Pelajari metode pembibitan tanaman nilam menggunakan stek batang untuk menjamin persentase tumbuh tinggi dan bebas patogen sejak awal.',
    'Learn the stem cutting method for patchouli seedlings to guarantee high survival rates and disease-free growth from the start.',
    E'# Panduan Praktis Pembibitan Nilam dengan Teknik Stek\n\nPembibitan merupakan fase awal paling krusial dalam pertanian nilam. Stek batang yang sehat dan terawat dengan baik akan menghasilkan tanaman dewasa berdaun lebat dengan kadar minyak atsiri yang melimpah.\n\n## 1. Pemilihan Batang Induk\n* Pilih tanaman induk nilam yang sehat, kuat, berusia **6-8 bulan**, dan telah terbukti memiliki kadar PA tinggi.\n* Ambil cabang bagian tengah yang sudah agak berkayu (setengah tua) berwarna cokelat kehijauan. Cabang yang terlalu muda (hijau lunak) rentan membusuk, sedangkan yang terlalu tua lambat bertunas.\n\n## 2. Pemotongan Stek\n* Potong cabang nilam sepanjang **10-15 cm** dengan menyisakan **2 hingga 3 ruas daun**.\n* Gunakan gunting stek tajam yang steril. Potong miring 45 derajat di bawah ruas terakhir untuk memperluas area pertumbuhan akar baru.\n\n## 3. Media Tanam & Penyemaian\n* Campurkan media tanam berupa tanah subur gembur, sekam padi bakar, dan kompos matang dengan perbandingan **2:1:1**.\n* Letakkan di tempat penyemaian teduh (intensitas cahaya 50%) selama **3-4 minggu** pertama sampai sistem perakaran berkembang sebelum dipindahkan ke lahan terbuka.',
    E'# Practical Guide to Patchouli Seedling Cultivation Using Stem Cuttings\n\nSeedling cultivation is the most crucial early phase in patchouli farming. Healthy and well-maintained stem cuttings will grow into mature plants with abundant leaf yields and high essential oil content.\n\n## 1. Parent Plant Selection\n* Select parent patchouli plants that are healthy, robust, **6-8 months old**, and proven to yield high PA levels.\n* Take middle branches that are semi-woody (semi-mature) with green-brown coloration. Branches that are too young (soft green) tend to rot, while those that are too old take longer to sprout.\n\n## 2. Cutting Preparation\n* Cut the patchouli branch into lengths of **10-15 cm**, ensuring **2 to 3 leaf nodes** are present.\n* Use sharp, sterilized pruning shears. Cut diagonally at a 45-degree angle below the lowest node to maximize the rooting surface area.\n\n## 3. Soil Medium & Nursery Care\n* Prepare a soil mix consisting of loose topsoil, burnt rice husks, and mature compost in a ratio of **2:1:1**.\n* Place the nursery bags in a shaded area (50% light penetration) for the first **3-4 weeks** until a robust root system develops before transplanting.',
    'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&h=500&fit=crop',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'admin',
    'true',
    5,
    now() - interval '18 hours'
  ),
  (
    'c8b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'artikel',
    'published',
    'teknologi-fraksinasi-vakum-minyak-nilam',
    'Teknologi Fraksinasi Vakum: Memisahkan Komponen Minyak Nilam Bernilai Tinggi',
    'Vacuum Fractionation Technology: Separating High-Value Compounds in Patchouli Oil',
    'Bagaimana teknologi penyulingan bertingkat dan fraksinasi vakum memisahkan Patchouli Alcohol dari fraksi ringan untuk menargetkan industri parfum mewah.',
    'How fractional distillation and vacuum fractionation isolate Patchouli Alcohol from light fractions to supply the luxury perfumery market.',
    E'# Fraksinasi Vakum dalam Pengolahan Minyak Nilam\n\nMinyak nilam mentah hasil distilasi petani lokal mengandung berbagai komponen kimia dengan titik didih berbeda. Untuk menghasilkan Patchouli Alcohol (PA) berkadar sangat tinggi (di atas 50-60%) bagi industri parfum premium, diperlukan proses **Fraksinasi Vakum**.\n\n## 1. Cara Kerja Fraksinasi Vakum\nDi bawah tekanan atmosfer normal, pemanasan minyak nilam pada suhu sangat tinggi dapat merusak struktur molekul PA atsiri (terjadi dekomposisi termal).\n* Dengan mengurangi tekanan udara di dalam tabung distilasi bertingkat (kondisi vakum), titik didih seluruh komponen kimia diturunkan secara drastis.\n* Hal ini memungkinkan pemisahan senyawa secara bertahap pada suhu yang aman dan terkendali.\n\n## 2. Tahapan Fraksi\n* **Fraksi Ringan (Light Fraction):** Menguap pertama kali, mengandung hidrokarbon seskuiterpen ringan seperti *Beta-Patchoulene* yang memberikan aroma tajam kurang sedap.\n* **Fraksi Jantung (Heart Fraction):** Menguap pada suhu medium, kaya akan *Patchouli Alcohol* (PA) murni dengan profil aroma manis, kayu, dan earthy yang sangat halus.\n* **Fraksi Berat (Heavy Fraction):** Residu pekat yang tertinggal di bagian bawah ketel penyulingan.',
    E'# Vacuum Fractionation in Patchouli Oil Refining\n\nCrude patchouli oil distilled by local farmers contains various chemical compounds with different boiling points. To produce ultra-high grade Patchouli Alcohol (PA above 50-60%) for the luxury perfume industry, **Vacuum Fractionation** is required.\n\n## 1. Principles of Vacuum Fractionation\nUnder standard atmospheric pressure, heating patchouli oil to extreme temperatures damages the molecular structure of volatile PA (causing thermal decomposition).\n* By reducing the air pressure inside the fractional distillation column (vacuum conditions), the boiling point of all chemical compounds drops drastically.\n* This enables clean compound separation at safe, controlled temperatures.\n\n## 2. Fraction Cuts\n* **Light Fraction:** Vaporizes first, containing light sesquiterpene hydrocarbons like *Beta-Patchoulene*, which carry a sharp, less-desirable odor.\n* **Heart Fraction:** Vaporizes at medium temperatures, rich in pure *Patchouli Alcohol* (PA) with a sweet, woody, earthy, and smooth scent profile.\n* **Heavy Fraction:** Sticky dark residue left at the bottom of the boiler.',
    'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&h=500&fit=crop',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'admin',
    'true',
    6,
    now() - interval '6 hours'
  ),
  (
    'c9b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'cerita_koperasi',
    'published',
    'kemitraan-terlacak-koperasi-gayo-atsiri-eksportir',
    'Kemitraan Terlacak Koperasi Gayo Atsiri dengan Eksportir Internasional',
    'Tracked Partnerships: Gayo Atsiri Cooperative and International Exporters',
    'Kisah kolaborasi transparansi rantai pasok nilam Gayo Atsiri menggunakan kode QR ketertelusuran yang diakui pembeli kosmetik Uni Eropa.',
    'The story of Gayo Atsiri''s transparent supply chain partnerships using QR codes recognized by European cosmetics buyers.',
    E'# Kemitraan Rantai Pasok Terlacak di Tanah Gayo\n\nKeberhasilan Koperasi Produsen Atsiri Gayo menembus pasar ekspor kosmetik Uni Eropa tidak lepas dari komitmen mereka menyajikan data ketertelusuran (*traceability*) yang transparan dan jujur.\n\n## 1. Mengapa Ketertelusuran Begitu Penting?\nPembeli kosmetik mewah internasional ingin memastikan bahwa bahan baku parfum mereka diproduksi secara etis, bebas dari eksploitasi pekerja anak, dan ditanam di lahan non-deforestasi.\n* Platform B2B Valam menyediakan fitur **Kode QR Ketertelusuran** untuk setiap batch pengiriman.\n* Pembeli di Perancis dapat memindai kode QR untuk melihat letak kebun tumpang sari nilam di dataran tinggi Gayo secara langsung lewat peta satelit.\n\n## 2. Kemitraan Adil Berkelanjutan\nMelalui transparansi ketertelusuran ini, eksportir internasional bersedia menandatangani kontrak pembelian jangka panjang dengan harga **25% di atas rata-rata pasar lokal**, memberikan stabilitas pendapatan bagi keluarga petani kopi dan nilam di tanah Gayo.',
    E'# Tracked Supply Chain Partnerships in Gayo Highlands\n\nThe success of the Gayo Atsiri Cooperative in entering the EU cosmetics export market is built on their commitment to providing transparent and honest traceability data.\n\n## 1. Why is Traceability Critical?\nInternational luxury cosmetics buyers want to verify that their raw perfume ingredients are produced ethically, free from child labor, and grown on non-deforested lands.\n* The Valam B2B platform provides a **Traceability QR Code** for every single batch shipment.\n* Buyers in France can scan the QR code to view the exact location of the Gayo highlands patchouli intercropped fields directly on satellite maps.\n\n## 2. Fair Sustainable Partnerships\nThrough this traceability transparency, international exporters confidently sign long-term purchase contracts with prices **25% above local market averages**, ensuring stable livelihoods for coffee and patchouli farming families in Gayo.',
    'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&h=500&fit=crop',
    'b1e2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'koperasi_terverifikasi',
    true,
    5,
    now() - interval '2 hours'
  )
ON CONFLICT (slug) DO NOTHING;


-- ── 5. Seed Content-Tag Relations ───────────────────────────

INSERT INTO insights_content_tags (content_id, tag_id)
VALUES
  -- Panduan ↔ Budidaya & Distilasi
  ('c1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '01b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  ('c1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '02b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  -- Artikel ↔ Standardisasi & Harga Pasar
  ('c2b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '04b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  ('c2b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '03b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  -- Cerita Koperasi ↔ Kisah Koperasi
  ('c3b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '05b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  
  -- Panduan 4 ↔ Budidaya & Hama Penyakit
  ('c4b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '01b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  ('c4b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '07b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  -- Artikel 5 ↔ Standardisasi
  ('c5b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '04b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  -- Cerita Koperasi 6 ↔ Kisah Koperasi & Nilam Organik
  ('c6b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '05b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  ('c6b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '06b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  
  -- Panduan 7 ↔ Budidaya
  ('c7b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '01b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  -- Artikel 8 ↔ Distilasi
  ('c8b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '02b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  -- Cerita Koperasi 9 ↔ Kisah Koperasi & Nilam Organik
  ('c9b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '05b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  ('c9b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '06b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d')
ON CONFLICT (content_id, tag_id) DO NOTHING;


-- ── 6. Seed Content CTAs ─────────────────────────────────────

INSERT INTO insights_content_cta (id, content_id, label_id, label_en, target_url)
VALUES
  (
    'ca11c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'c2b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'Jelajahi Marketplace Minyak Nilam',
    'Browse Patchouli Oil Marketplace',
    '/marketplace'
  ),
  (
    'ca22c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'c3b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'Daftar Sebagai Supplier Valam',
    'Register as a Valam Supplier',
    '/register'
  ),
  (
    'ca33c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'c6b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'Lihat Produk Nilam Organik Gayo',
    'View Organic Gayo Patchouli Products',
    '/marketplace'
  )
ON CONFLICT (id) DO NOTHING;


-- ── 7. Seed Market Price History ─────────────────────────────
-- Inserting historical trend data for the charts (trigger registers updates automatically,
-- but we populate background history for premium chart visuals).

INSERT INTO insights_market_price_history (grade, price_per_kg, currency, recorded_at)
VALUES
  -- 90 days ago
  ('A', 780000, 'IDR', now() - interval '90 days'),
  ('B', 630000, 'IDR', now() - interval '90 days'),
  ('C', 480000, 'IDR', now() - interval '90 days'),
  -- 60 days ago
  ('A', 790000, 'IDR', now() - interval '60 days'),
  ('B', 640000, 'IDR', now() - interval '60 days'),
  ('C', 495000, 'IDR', now() - interval '60 days'),
  -- 30 days ago
  ('A', 800000, 'IDR', now() - interval '30 days'),
  ('B', 650000, 'IDR', now() - interval '30 days'),
  ('C', 500000, 'IDR', now() - interval '30 days'),
  -- 20 days ago
  ('A', 810000, 'IDR', now() - interval '20 days'),
  ('B', 660000, 'IDR', now() - interval '20 days'),
  ('C', 510000, 'IDR', now() - interval '20 days'),
  -- 10 days ago
  ('A', 830000, 'IDR', now() - interval '10 days'),
  ('B', 680000, 'IDR', now() - interval '10 days'),
  ('C', 530000, 'IDR', now() - interval '10 days'),
  -- Today
  ('A', 850000, 'IDR', now()),
  ('B', 700000, 'IDR', now()),
  ('C', 550000, 'IDR', now())
ON CONFLICT DO NOTHING;
