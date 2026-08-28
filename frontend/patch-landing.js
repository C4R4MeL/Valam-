const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/[locale]/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add imports
content = content.replace(
  'import { Footer } from "@/components/layout/Footer";',
  'import { Footer } from "@/components/layout/Footer";\nimport { useLocale } from "next-intl";\nimport { landingContent } from "./pageContent";'
);

// Add hooks
content = content.replace(
  'export default function Home() {',
  'export default function Home() {\n  const locale = useLocale() as "id" | "en";\n  const content = landingContent[locale];'
);

// Fix intervals & maps
content = content.replace(/heroSlides\.length/g, 'content.heroSlides.length');
content = content.replace(/heroSlides\.map/g, 'content.heroSlides.map');
content = content.replace(/heroSlides\[currentSlide\]/g, 'content.heroSlides[currentSlide]');

// Hero Buttons
content = content.replace('Cari Minyak Nilam', '{content.buttons.searchOil}');
content = content.replace('Mulai sebagai Supplier', '{content.buttons.startSupplier}');

// Stats
content = content.replace('Supplier Aktif', '{content.stats.suppliers}');
content = content.replace('Negara Tujuan', '{content.stats.destinations}');
content = content.replace('Batch Terverifikasi', '{content.stats.verified}');
content = content.replace('Menyuplai Destinasi Fragrance Global:', '{content.brands}');

// Vision
content = content.replace('Visi Valam', '{content.vision.badge}');
content = content.replace('Menjembatani <span className="italic text-gold-600">90% Pasokan Dunia</span> dengan Standar Global yang Adil.', '{content.vision.title1} <span className="italic text-gold-600">{content.vision.titleHighlight}</span> {content.vision.title2}');
content = content.replace('Indonesia menyuplai 90% kebutuhan minyak nilam dunia sebagai bahan utama pembuat parfum mewah. Valam hadir memastikan petani mendapat harga yang adil, dan pembeli mendapat jaminan kualitas.', '{content.vision.desc}');
content = content.replace('Mulai Transaksi Pertama', '{content.vision.cta}');

// Features
content = content.replace('Keunggulan Valam', '{content.features.badge}');
content = content.replace('Kualitas Premium.<br/>', '{content.features.title}<br/>');
content = content.replace('<span className="italic text-emerald-700 font-normal">Tanpa Perantara.</span>', '<span className="italic text-emerald-700 font-normal">{content.features.titleHighlight}</span>');
content = content.replace('Platform B2B yang memutus rantai panjang, menjamin PA &gt;30% langsung dari penyuling lokal ke buyer global.', '{content.features.desc}');

content = content.replace('Certificate of Analysis (CoA)', '{content.features.cards[0].title}');
content = content.replace('Kadar <span className="font-semibold text-emerald-300">Patchouli Alcohol (PA) &gt;30%</span> adalah standar minimum. Setiap batch diverifikasi lab independen agar bebas kontaminasi.', '{content.features.cards[0].desc1}<span className="font-semibold text-emerald-300">{content.features.cards[0].descHighlight}</span>{content.features.cards[0].desc2}');

content = content.replace('GPS Traceability', '{content.features.cards[1].title}');
content = content.replace('Lacak perjalanan minyak dari koordinat kebun Sumatera hingga tiba di negara tujuan.', '{content.features.cards[1].desc}');

content = content.replace('Direct Trading', '{content.features.cards[2].title}');
content = content.replace('Sistem Smart Matching kami menghubungkan margin yang adil langsung ke pembeli utama.', '{content.features.cards[2].desc}');

content = content.replace('Jangkauan Pasar Global', '{content.features.cards[3].title}');
content = content.replace('<span className="font-semibold text-gold-300">Indonesia menyuplai 90% kebutuhan dunia</span>. Kami menjembatani suplai lokal dengan buyer global untuk bahan baku luxury perfume.', '<span className="font-semibold text-gold-300">{content.features.cards[3].descHighlight}</span>{content.features.cards[3].desc2}');

// Verification
content = content.replace('Pilar Transparansi B2B', '{content.verification.badge}');
content = content.replace('Verifikasi Kimiawi & <span className="italic text-gold-300">Asal-Usul Komoditas</span>', '{content.verification.title1} <span className="italic text-gold-300">{content.verification.titleHighlight}</span>');
content = content.replace('Uji lab independen dan rekam jejak digital memastikan setiap tetes minyak memenuhi kriteria tertinggi.', '{content.verification.desc}');
content = content.replace('Pilih Batch Pengiriman', '{content.verification.selectBatch}');
content = content.replace('Kelompok Tani:', '{content.verification.labels.farmerGroup}');
content = content.replace('Tanggal Suling:', '{content.verification.labels.harvestDate}');
content = content.replace('Kapasitas Bulanan:', '{content.verification.labels.capacity}');
content = content.replace('Kadar Kemurnian:', '{content.verification.labels.purity}');
content = content.replace('Quality & Origin Passport', '{content.verification.passport.title}');
content = content.replace('Sertifikat Digital Terverifikasi', '{content.verification.passport.subtitle}');
content = content.replace('PA SCORE', '{content.verification.passport.scoreLabel}');
content = content.replace('LULUS UJI LAB', '{content.verification.passport.passedBadge}');
content = content.replace('Kadar PA di atas standar ekspor. Bebas dari logam berat dan kontaminasi.', '{content.verification.passport.passedDesc}');
content = content.replace('Daerah Asal (Terroir)', '{content.verification.passport.origin}');
content = content.replace('Ketinggian Lahan', '{content.verification.passport.altitude}');
content = content.replace('Metode Panen', '{content.verification.passport.method}');
content = content.replace('Warna Minyak', '{content.verification.passport.color}');
content = content.replace('Kadar Air', '{content.verification.passport.moisture}');

// How It Works
content = content.replace('Proses Terintegrasi', '{content.howItWorks.badge}');
content = content.replace('Cara Kerja <span className="italic text-gold-600 font-normal">Ekosistem Valam.</span>', '{content.howItWorks.title1} <span className="italic text-gold-600 font-normal">{content.howItWorks.titleHighlight}</span>');
content = content.replace('Dari verifikasi lahan hingga pelacakan logistik ekspor—semuanya tercatat dengan presisi.', '{content.howItWorks.desc}');

content = content.replace(
  /\n\s*\{\[\n\s*\{\s*id:\s*1,\s*title:\s*"Registrasi & Verifikasi Mutu"[^\]]*\]\.map\(\(step\) => \(/m,
  '\n                {content.howItWorks.steps.map((step) => ('
);

// Calculator
content = content.replace('Logistik & Simulasi Transaksi', '{content.calculator.badge}');
content = content.replace('Simulasi RFQ Ekspor <span className="italic text-emerald-700">Instan</span>', '{content.calculator.title} <span className="italic text-emerald-700">{content.calculator.titleHighlight}</span>');
content = content.replace('Hitung kapasitas kargo dan estimasi logistik, lengkap dengan dokumen ekspor.', '{content.calculator.desc}');
content = content.replace('Volume Pengadaan (Kg)', '{content.calculator.volumeLabel}');
content = content.replace('Destinasi Ekspor Pelabuhan', '{content.calculator.destinationLabel}');
content = content.replace('Protokol Keamanan:', '{content.calculator.securityProtocol}');
content = content.replace('Escrow Internasional B2B', '{content.calculator.securityValue}');
content = content.replace('Kemurnian Terjamin:', '{content.calculator.purityGuarantee}');
content = content.replace('Min. PA 30% (CoA Terlampir)', '{content.calculator.purityValue}');
content = content.replace('Hasil Proyeksi Kargo', '{content.calculator.resultTitle}');
content = content.replace('Estimasi & Konfigurasi Pengiriman', '{content.calculator.resultSubtitle}');
content = content.replace('Mode Kemasan / Wadah', '{content.calculator.packagingLabel}');
content = content.replace('"Drum Baja Food-Grade 25 Kg"', 'content.calculator.packagingSmall');
content = content.replace('"Drum Baja Pelindung 200 Kg"', 'content.calculator.packagingMed');
content = content.replace('"IsoTank Kargo Khusus"', 'content.calculator.packagingLarge');
content = content.replace('Waktu Tempuh Ekspor', '{content.calculator.timeLabel}');
content = content.replace('Rute Pelayaran Logistik:', '{content.calculator.routeLabel}');
content = content.replace('Aceh (Kebun)', '{content.calculator.routeStart}');
content = content.replace('Belawan Port', '{content.calculator.routeMiddle}');
content = content.replace('Sertifikat & Dokumen Ekspor Otomatis:', '{content.calculator.docLabel}');

content = content.replace(
  /\{\[\s*\{\s*name:\s*"Certificate of Analysis \(Lab UTU\)"[^\]]*\]\.map/m,
  `{[
    { name: content.calculator.docs[0], required: true },
    { name: content.calculator.docs[1], required: true },
    { name: content.calculator.docs[2], required: true },
    { name: content.calculator.docs[3], required: rfqVolume >= 1000 },
    { name: content.calculator.docs[4], required: rfqVolume >= 2000 }
  ].map`
);

content = content.replace('Dukungan Pendanaan', '{content.calculator.fundingLabel}');
content = content.replace('Mitra Perbankan L/C & B2B Escrow Aman', '{content.calculator.fundingValue}');
content = content.replace('Ajukan RFQ Resmi', '{content.calculator.rfqButton}');

// Testimonials
content = content.replace('Kepercayaan yang Dibangun Bersama', '{content.testimonials.title}');
content = content.replace('Pengalaman dari mereka yang telah merasakan dampak positif ekosistem Valam.', '{content.testimonials.desc}');
content = content.replace('"Valam memecahkan masalah transparansi yang selama ini menjadi kendala industri parfum Eropa. Kemampuan melacak terroir lahan hingga kadar GC-MS secara real-time sungguh luar biasa."', '{content.testimonials.buyerReview}');
content = content.replace('Procurement Director, Grasse, Perancis', '{content.testimonials.buyerRole}');
content = content.replace('"Dulu kami selalu berhadapan dengan tengkulak tanpa tahu harga pasaran. Kini, minyak nilam kami dihargai pantas sesuai standar PA%, langsung terhubung dengan buyer dunia."', '{content.testimonials.supplierReview}');
content = content.replace('Ketua Koperasi Tani Nilam, Aceh Jaya', '{content.testimonials.supplierRole}');

// CTA
content = content.replace('Siap Bergabung dengan{" "}', '{content.cta.title1}{" "}');
content = content.replace('<span className="italic text-gold-300 font-normal">Ekosistem Nilam</span>{" "}', '<span className="italic text-gold-300 font-normal">{content.cta.titleHighlight}</span>{" "}');
content = content.replace('Terbesar?', '{content.cta.title2}');
content = content.replace('Bergabunglah dengan ratusan supplier terverifikasi dan buyer global yang sudah mempercayakan rantai pasok mereka pada infrastruktur transparan Valam.', '{content.cta.desc}');
content = content.replace('Daftar sebagai Supplier', '{content.cta.supplierButton}');
content = content.replace('Daftar sebagai Buyer', '{content.cta.buyerButton}');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done!');
