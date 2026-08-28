# Dokumentasi Alur Buyer Valam — Lokal dan Internasional

---

## 1. Cara Sistem Mengenali Buyer

### Dari mana sistem tahu buyer ini lokal atau internasional?

Sistem Valam **tidak** mendeteksi ini secara otomatis dari IP atau bahasa browser. Pembedaan dilakukan melalui data yang buyer isi saat registrasi — khususnya field `country` dan `role_id` pada model `User` dan tabel `Profile`.

### Titik deteksi #1 — Register page

Saat buyer memilih role **Buyer** di form registrasi, sistem menyimpan data ke tabel `User` dan `Profile`. Field `country` di profil inilah yang menjadi penanda utama.

| Field | Nilai buyer lokal | Nilai buyer internasional | Tabel DB |
|---|---|---|---|
| `country` | "Indonesia" / "ID" | Negara lain (FR, SG, US...) | `Profile` |
| `role_id` | role BUYER | role BUYER (sama) | `User` |
| `company_name` | Nama UMKM lokal | Nama perusahaan global | `Profile` |
| `npwp` | Diisi (wajib pajak RI) | Tidak diisi / tidak ada | `Profile` |

### Titik deteksi #2 — RFQ & Checkout

Selain data registrasi, sistem bisa membaca konteks dari cara buyer bertransaksi:

```
Buyer submit RFQ → Ada field "shipping address" → Jika luar negeri = internasional
Buyer checkout   → Alamat pengiriman diisi       → Negara tujuan terdeteksi
```

> ✅ **Catatan:** Sistem secara otomatis mendeteksi domisili buyer (`country`). Bagi buyer internasional (`country ≠ "ID"`), sistem menyembunyikan opsi beli langsung (Direct Checkout/Add to Cart) dan menampilkan alur Live RFQ serta opsi L/C (Letter of Credit) Inquiry.

### Implikasi ke fitur platform

| Kondisi terdeteksi | Respons sistem | Status di MVP |
|---|---|---|
| `country = "ID"` | Tampilkan metode bayar lokal (transfer, fintech) | 🟡 Parsial |
| `country ≠ "ID"` | Tampilkan opsi RFQ + L/C, sembunyikan checkout langsung | 🟢 Tersedia |
| `country ≠ "ID"` | Sediakan template dokumen ekspor (COO, MSDS) | 🟢 Tersedia |
| Semua buyer | Tampilkan CoA, traceability, Smart Matching | 🟢 Tersedia |

---

## 2. Alur Buyer Lokal

**Profil:** UMKM parfum / kosmetik Indonesia

### Langkah 1 — Registrasi akun buyer lokal

*Titik pertama sistem mengenali buyer ini lokal.*

Buyer membuka halaman `/register` dan memilih role **Buyer**. Sistem mencatat field kunci berikut ke database:

| Field | Nilai yang diisi | Tabel |
|---|---|---|
| `role_id` | BUYER | User |
| `country` | Indonesia / ID | Profile |
| `npwp` | Diisi (wajib pajak RI) | Profile |
| `status` | pending (menunggu verifikasi admin) | User |

> ✅ Field `country = "ID"` inilah yang menjadi penanda sistem bahwa ini buyer lokal — implikasinya: tampilkan metode pembayaran Rupiah, kalkulasi ongkir domestik, dan tidak perlu dokumen ekspor.

### Langkah 2 — Login & akses marketplace

*Buyer login dan mulai jelajahi katalog produk.*

Setelah akun diverifikasi admin, buyer login via `/login`. Token JWT dikembalikan dan disimpan di sisi client.

Buyer mengakses `/marketplace` — halaman ini menampilkan seluruh produk dengan status `APPROVED` (sudah lolos QC admin). Buyer bisa menggunakan filter:

- PA% minimum / maksimum
- Moisture maksimum
- Origin (asal daerah)
- Rentang harga per kg
- Volume tersedia (kg)

> ℹ️ Setiap produk hanya tampil jika statusnya `APPROVED`. Produk `DRAFT` atau `IN_LAB` tidak terlihat oleh buyer.

### Langkah 3 — Evaluasi produk & verifikasi CoA

*Buyer klik detail produk dan periksa keaslian.*

Buyer membuka halaman detail produk `/marketplace/product/:id`. Di sini buyer melihat:

| Informasi | Sumber data |
|---|---|
| PA% (Patchouli Alcohol) | Tabel `QcResult` |
| Kadar moisture | Tabel `QcResult` |
| Optical rotation | Tabel `QcResult` |
| Certificate of Analysis (CoA) digital | Tabel `Certificate` |
| Info supplier + asal daerah | Tabel `User` → Supplier |
| QR Code traceability | Tabel `TraceLog` |

> ✅ Buyer lokal cukup melihat CoA digital untuk yakin. Tidak perlu dokumen tambahan seperti MSDS atau COO.

### Langkah 4 — Smart Matching (opsional)

*Jika buyer punya spesifikasi teknis spesifik.*

Jika buyer kesulitan memilih dari katalog, mereka bisa gunakan `/matching`. Buyer mengisi form:

- Volume target (kg)
- PA% minimum
- Moisture maksimum
- Budget per kg

Sistem menjalankan algoritma **MCDM Euclidean Distance** — membandingkan input buyer dengan semua stok aktif supplier dan mengembalikan daftar produk terurut berdasarkan skor kecocokan (0.00–1.00).

> ℹ️ Hasil Smart Matching ditampilkan di `/dashboard/buyer/matching`. Dari sini buyer bisa langsung klik ke detail produk untuk lanjut ke cart.

### Langkah 5 — Tambah ke cart & checkout

*Buyer tentukan kuantitas dan lanjut pesan.*

Buyer menambahkan produk ke keranjang `/cart` dengan satuan kilogram. Sistem mengunci stok sementara (`available_volume_kg` dikurangi).

Di halaman `/checkout`, buyer mengisi:

| Field | Keterangan |
|---|---|
| Alamat pengiriman | Alamat gudang/toko buyer di Indonesia |
| Metode pembayaran | Transfer bank B2B atau fintech |
| Kalkulasi ongkir | Berdasarkan berat drum + jarak domestik |

Sistem membuat entri `Order` + `OrderItem` + `Payment`.

> ⚠️ Integrasi API kurir kargo untuk kalkulasi ongkir otomatis belum terkonfirmasi di dokumentasi — ini salah satu gap yang perlu diselesaikan sebelum deploy.

### Langkah 6 — Tracking pengiriman

*Buyer pantau status kargo dari dashboard.*

Setelah pembayaran dikonfirmasi, supplier menyerahkan kargo ke kurir domestik. Buyer bisa memantau di `/dashboard/buyer/orders`.

```
Order created → Paid → Shipped → Delivered
```

Data tracking berasal dari tabel `Shipment` yang diupdate oleh supplier saat menyerahkan resi kurir.

> ✅ Setelah barang diterima dan resi valid, sistem otomatis mentransfer dana ke `Wallet` supplier — siap dicairkan via fitur withdrawal.

---

## 3. Alur Buyer Internasional

**Profil:** Fragrance house global

### Langkah 1 — Registrasi akun buyer internasional

*Titik pertama sistem mengenali buyer ini dari luar negeri.*

Buyer membuka `/register` dan memilih role **Buyer**. Yang membedakan dari buyer lokal adalah field yang diisi:

| Field | Nilai yang diisi | Tabel |
|---|---|---|
| `role_id` | BUYER | User |
| `country` | Negara asal (FR, SG, US, dll) | Profile |
| `npwp` | Kosong / tidak ada | Profile |
| `company_name` | Nama perusahaan global | Profile |
| `status` | pending (menunggu verifikasi admin) | User |

> ℹ️ Field `country ≠ "ID"` adalah sinyal utama. Di sistem ideal, ini akan memicu tampilan UI yang berbeda — menyembunyikan checkout langsung dan menampilkan alur RFQ. Di MVP saat ini, pembedaan ini belum otomatis.

### Langkah 2 — Eksplorasi katalog & verifikasi EUDR

*Buyer internasional butuh lebih dari sekadar CoA.*

Buyer internasional — khususnya dari Eropa — memiliki kebutuhan tambahan di luar CoA biasa. Mereka perlu memastikan minyak nilam yang dibeli bebas dari deforestasi (regulasi EUDR Uni Eropa berlaku sejak 2025).

Yang diperiksa buyer internasional di halaman detail produk:

| Yang diperiksa | Tersedia di Valam? |
|---|---|
| CoA digital (PA%, moisture, optical rotation) | 🟢 Ada |
| Koordinat GPS kebun asal (TraceLog) | 🟢 Ada — via traceability |
| Timeline pergerakan batch dari kebun ke pelabuhan | 🟢 Ada — via traceability |
| Dokumen EUDR resmi (due diligence statement) | 🟢 Tersedia |
| MSDS (Material Safety Data Sheet) | 🟢 Tersedia |

> ✅ Data GPS koordinat kebun dari `TraceLog` diintegrasikan langsung ke dalam Paket Dokumen Kepatuhan Ekspor (EUDR Statement) di tab "Export Docs" halaman detail produk.

### Langkah 3 — Negosiasi via RFQ

*Buyer internasional tidak langsung checkout — mereka negosiasi dulu.*

Berbeda dari buyer lokal yang bisa langsung checkout, buyer internasional hampir selalu melalui proses negosiasi formal. Alurnya di Valam:

```
Buyer submit RFQ → Supplier terima notifikasi → Supplier beri counter-offer → Buyer setuju → kontrak
```

RFQ memuat: volume yang dibutuhkan, spesifikasi PA% target, batas moisture, harga yang diharapkan per kg, dan timeline pengiriman.

> ✅ Fitur ini sudah ada di Valam — model `RfqRequest` dan `RfqResponse` sudah dibangun. Supplier bisa kirim counter-offer dari dashboard mereka.

### Langkah 4 — Mekanisme pembayaran internasional

*L/C atau T/T — keduanya berbeda dari transfer lokal.*

Pembayaran lintas negara tidak bisa pakai transfer bank biasa. Ada dua mekanisme utama:

| Mekanisme | Cara kerja | Kelebihan |
|---|---|---|
| **T/T (Telegraphic Transfer)** | Buyer transfer langsung ke rekening supplier — biasanya DP 30% di awal, 70% setelah B/L diterima | Lebih cepat dan sederhana |
| **L/C (Letter of Credit)** | Bank buyer menerbitkan jaminan pembayaran ke bank supplier — dana cair setelah dokumen ekspor lengkap diserahkan | Lebih aman untuk kedua pihak |

> ⚠️ Di MVP Valam saat ini, tidak ada dukungan untuk L/C maupun pembayaran multi-currency. PRD sudah mengategorikan ini sebagai *Won't Have*. Untuk sementara, buyer internasional harus menyelesaikan pembayaran di luar platform (off-platform T/T).

### Langkah 5 — Pengurusan dokumen ekspor

*Lapisan dokumen tambahan yang tidak dibutuhkan buyer lokal.*

Setelah deal disepakati, supplier harus menyiapkan paket dokumen ekspor. Ini yang membedakan transaksi internasional secara fundamental:

| Dokumen | Diterbitkan oleh | Fungsi |
|---|---|---|
| Commercial Invoice | Supplier | Tagihan resmi transaksi |
| Packing List | Supplier | Rincian isi kemasan drum |
| CoA resmi (lab terakreditasi) | Lab + Admin Valam | Bukti kualitas kimia |
| MSDS | Supplier | Keamanan bahan kimia untuk angkutan laut |
| COO / SKTE | Kementerian Perdagangan RI | Bukti asal barang dari Indonesia |
| PEB | Bea Cukai + PPJK/forwarder | Pemberitahuan ekspor ke sistem pabean RI |
| Bill of Lading (B/L) | Shipping line | Bukti kepemilikan barang di laut |

> ⚠️ Dari semua dokumen di atas, hanya CoA yang dihasilkan sistem Valam. Sisanya diurus di luar platform oleh supplier, forwarder, dan instansi pemerintah — ini batas MVP saat ini.

### Langkah 6 — Pengiriman laut & tracking

*Kargo bergerak dari pelabuhan Indonesia ke negara buyer.*

Kargo dimuat ke kontainer di pelabuhan (Belawan / Tanjung Priok) dan dikirim ke negara tujuan.

```
Muat kargo → B/L diterbitkan → Transit laut 7–30 hari → Tiba pelabuhan tujuan
```

| Rute umum | Estimasi waktu |
|---|---|
| Indonesia → Singapura | 3–5 hari |
| Indonesia → Eropa (Rotterdam/Hamburg) | 25–30 hari |
| Indonesia → Amerika Serikat | 20–28 hari |

> ⚠️ Tracking nomor B/L dan ETA kapal belum ada di platform Valam — buyer internasional perlu memantau langsung ke website shipping line menggunakan nomor B/L yang dikirim supplier via email.

### Langkah 7 — Customs clearance & penerimaan akhir

*Proses di negara buyer sebelum barang diterima.*

Saat kargo tiba, buyer (atau customs broker mereka) mengurus:

```
Bea masuk impor → Inspeksi dokumen → Quality re-check → Barang diterima gudang
```

Di tahap quality re-check, buyer membandingkan hasil uji fisik sesampainya di gudang dengan CoA yang sudah diterima dari Valam. Jika ada perbedaan signifikan (PA% tidak sesuai, dll), ini bisa memicu klaim atau dispute.

> ✅ Di sinilah CoA digital Valam memiliki nilai paling besar — sebagai dokumen referensi yang bisa dibandingkan dengan hasil uji ulang buyer. Traceability QR juga bisa dipakai untuk membuktikan asal-usul batch secara digital.

> ⚠️ Setelah barang diterima dan buyer konfirmasi, jika menggunakan L/C maka bank akan mencairkan dana ke supplier. Di MVP, mekanisme ini terjadi di luar platform.

---

## 4. Perbandingan Lokal vs Internasional

### Tabel perbandingan titik per titik

| Aspek | Buyer lokal | Buyer internasional |
|---|---|---|
| Cara registrasi | country = ID, isi NPWP | country = luar RI, tanpa NPWP |
| Cara sistem kenali | Field `country` di Profile | Field `country` di Profile |
| Pencarian produk | Marketplace + Smart Matching | Marketplace + Smart Matching (sama) |
| Evaluasi produk | CoA digital cukup | CoA + EUDR traceability data |
| Cara negosiasi | Langsung checkout | RFQ → counter-offer → kontrak |
| Pembayaran | Transfer bank / fintech lokal | T/T atau Letter of Credit (L/C) |
| Dokumen dibutuhkan | Invoice, packing list, CoA, surat jalan | + COO, PEB, MSDS, B/L, EUDR doc |
| Pengiriman | Kurir kargo domestik (1–7 hari) | Shipping line laut (7–30 hari) |
| Tracking | Resi kurir lokal | Nomor B/L + ETA kapal |
| Wallet supplier | Rupiah, cairkan langsung | Multi-currency, perlu konversi |
| Support di MVP | 🟢 Hampir lengkap | 🟡 Terbatas (RFQ + CoA saja) |

### Yang SAMA untuk keduanya

- Registrasi buyer
- Filter marketplace
- Smart Matching
- CoA digital
- Traceability QR
- Submit RFQ
- Buyer dashboard

### Hanya untuk buyer internasional

- Letter of Credit
- COO / SKTE
- PEB Bea Cukai
- MSDS dokumen
- Bill of Lading
- EUDR compliance
- Tracking B/L kapal
- Multi-currency
