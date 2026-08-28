# UX_IMPROVEMENT_PLAN.md

Dokumen ini berisi hasil audit mendalam terhadap pengalaman pengguna (UX), arsitektur informasi, alur navigasi, konsistensi visual, serta usulan redesain terstruktur untuk platform **Valam B2B Managed-Marketplace Minyak Nilam** berdasarkan dokumen PRD, desain sistem, dan blueprint pengembangan.

---

## 1. Ringkasan Audit UX (UX Audit Summary)

Valam dirancang bukan hanya sebagai e-commerce transaksional biasa, melainkan sebagai **infrastruktur penjamin mutu dan kepercayaan (Trust Infrastructure)** yang menjembatani asimetri informasi kualitas minyak nilam antara koperasi hulu (Supplier) dan pelaku industri manufaktur kosmetik lokal/global (Buyer). 

### Temuan Audit Utama:
* **Aspek Trust & Kredibilitas:** Visualisasi parameter uji lab (PA%, Kadar Air) dan *Digital Certificate of Analysis* (CoA) sudah menjadi fokus yang bagus, namun integrasinya di antarmuka katalog masih terfragmentasi dan belum cukup meyakinkan pembeli institusional skala besar secara instan.
* **Beban Kognitif (Cognitive Load):** Navigasi global sebelumnya mencampuradukkan tautan publik (marketing) dengan aksi dasbor operasional (seperti *Inventori, Tambah Batch, Dompet* untuk supplier langsung di header utama). Hal ini memicu kebingungan alur (*task disorientation*).
* **Konsistensi Alur (User Flow Alignment):** Alur verifikasi admin untuk supplier baru dan proses verifikasi mutu fisikokimia (QC) belum sepenuhnya sinkron dengan ketersediaan barang di etalase marketplace.
* **Aksesibilitas & Usability:** Beberapa tombol tindakan utama (*Primary CTA*) pada formulir multibagian (wizard) belum mematuhi aturan penempatan yang *thumb-friendly* (Hukum Fitts) dan kurang menyediakan status penanganan kegagalan (*empty & error states*) yang deskriptif.

---

## 2. Masalah Sistem Saat Ini (Current Problems)

Berdasarkan tinjauan struktur berkas frontend, PRD, dan `design.md`, berikut adalah 5 area masalah kritis yang perlu diselesaikan:

1. **Pencampuran Ruang Lingkup Navigasi (Navigation Scope Pollution):**
   * *Problem:* Pengguna yang sudah masuk (*logged in*) melihat terlalu banyak tautan operasional dasbor di header atas situs publik.
   * *Impact:* Merusak estetika visual, membingungkan pembeli retail/tamu, dan menyulitkan navigasi di layar seluler/tablet karena ruang header yang terbatas.

2. **Keterputusan Alur QC dan Katalog (Unlinked Quality Verification):**
   * *Problem:* Batch produk hulu yang didaftarkan supplier langsung masuk ke status `IN_LAB` namun data kimiawi kosong dan tidak terlihat oleh pembeli sebelum diverifikasi admin.
   * *Impact:* Pembeli tidak mendapatkan estimasi kapan batch dengan PA% tinggi akan tersedia, sementara admin tidak memiliki alur kelola yang dinamis dari status pengujian ke etalase toko.

3. **Gaya Komponen Tidak Konsisten (Design System Drift):**
   * *Problem:* Lencana status (*status badges*), format mata uang, tombol, dan visualisasi nilai PA% di halaman *Marketplace*, *Smart Matching*, dan *Detail Produk* memiliki variasi gaya warna yang berbeda-beda.
   * *Impact:* Mengurangi kredibilitas visual platform di mata pembeli institusional internasional (*global buyers*).

4. **Ketiadaan Pencegahan Kesalahan Input Form (Weak Error Prevention):**
   * *Problem:* Form tambah batch tidak membatasi input volume negatif atau angka harga di luar batas pasar, serta pesan kesalahan (*error message*) bersifat generik (seperti *"Error"* atau *"Gagal"*).
   * *Impact:* Menurunkan tingkat penyelesaian pengisian data (*form completion rate*) oleh ketua koperasi hulu yang memiliki tingkat literasi digital dasar.

5. **Ketidaksesuaian dengan Hukum Fitts & Hick (Fitts's & Hick's Law Violations):**
   * *Problem:* Dasbor utama menyajikan semua pilihan menu sekaligus secara mendatar dengan bobot visual yang seragam, tanpa menonjolkan aksi utama (*Primary Action*) seperti "+ Tambah Batch Baru" untuk supplier atau "Temukan Suplai" untuk buyer.
   * *Impact:* Waktu pengambilan keputusan pengguna menjadi lebih lambat dan memicu kebingungan prioritas aksi.

---

## 3. Rekomendasi Peningkatan (Recommended Improvements)

Berikut adalah rekomendasi redesign berbasis prinsip UI/UX profesional untuk mengoptimalkan pengalaman pengguna:

* **Penerapan Struktur Navigasi 2-Tingkat (Split Navigation):**
   * Pisahkan Navbar publik (fokus pada pencarian katalog dan informasi umum) dengan Dasbor internal (fokus pada pengerjaan tugas operasional). Saat masuk (*logged in*), navigasi operasional dipindahkan ke **Sub-Tab Navigasi Horizontal** (gaya tab Stripe) di bawah tajuk dasbor.
* **Integrasi Uji Lab & Marketplace yang Transparan:**
   * Batch berstatus `IN_LAB` tetap dicatat dalam sistem antrean admin. Ketika admin selesai memverifikasi dan menerbitkan CoA digital, produk secara otomatis bermigrasi ke status `VERIFIED` dan terbit di marketplace tanpa membutuhkan intervensi manual tambahan dari supplier.
* **Optimalisasi Hukum Fitts pada CTA Formulir:**
   * Letakkan tombol "+ Tambah Batch" dan "Kirim Sampel QC" di lokasi yang mencolok dengan kontras warna Emerald-Gold yang tinggi. Pada perangkat seluler, gunakan tombol melekat (*sticky button*) di bagian bawah layar.
* **Visualisasi Kredibilitas Produk Instan:**
   * Di dalam kartu produk katalog, tampilkan visualisasi grafis parameter utama (PA% dan Moisture%) menggunakan grafik batang horizontal mini untuk mempercepat pengenalan (*recognition over recall*).

---

## 4. Redesain Arsitektur Informasi (Redesigned Information Architecture)

### Current Structure (Struktur Lama):
```
Valam (Root)
├── Landing Page
├── Login / Register (Role selection)
├── Navbar (Public & Dashboard Links mixed)
│   ├── Beranda
│   ├── Marketplace
│   ├── Inventori (Supplier only)
│   ├── Tambah Batch (Supplier only)
│   ├── Pesanan (Supplier only)
│   ├── Dompet (Supplier only)
│   ├── RFQ (Supplier/Buyer mixed)
│   ├── Smart Matching (Buyer only)
│   └── Cart (Buyer only)
├── Buyer Dashboard (Stats & History)
├── Supplier Dashboard (Stats & History)
└── Admin Dashboard (Users, QC, Transactions)
```

### Recommended Structure (Struktur Baru yang Lebih Efektif):
```
Valam (Root)
│
├── Public Pages (Akses Umum)
│   ├── Landing Page (Value proposition, alur kerja, registrasi CTA)
│   ├── Marketplace (Katalog filter parameter PA%, kadar air, asal daerah)
│   ├── Smart Matching (Form skoring MCDM pembeli untuk menemukan suplai terbaik)
│   └── Traceability Scan (Pencarian log linimasa kebun & peta GPS via QR / ID Batch)
│
├── Authentication
│   ├── Login
│   └── Register (Pemilihan peran yang tegas: Buyer vs Supplier)
│
└── Role-Based Dashboards & Sub-Navigation (Terisolasi per Peran)
    │
    ├── Buyer Space
    │   ├── Overview (Metrik pembelian, pesanan aktif, pengeluaran)
    │   ├── My Orders (Riwayat belanja, status kargo, dokumen impor, Dispute)
    │   ├── Smart Matching (Akses cepat form pencarian kustom pembeli)
    │   └── Request RFQ (Papan pengajuan penawaran volume besar & negosiasi kontrak)
    │
    ├── Supplier Space
    │   ├── Overview (Metrik volume aktif, saldo, batch menunggu QC, grafik penjualan)
    │   ├── Inventory (Tabel batch, status verifikasi, cetak QR Code PDF)
    │   ├── Add Batch (Form wizard multi-step pendaftaran panen baru)
    │   ├── Incoming Orders (Kelola pengiriman kargo drum minyak, input resi logistik)
    │   ├── Digital Wallet (Penarikan dana saldo escrow, histori mutasi rekening)
    │   └── RFQ Opportunities (Papan peninjauan penawaran harga dari buyer)
    │
    └── Admin Control Center
        ├── Overview (Status ekosistem, total transaksi, pengajuan menunggu tindakan)
        ├── Supplier Verification (Persetujuan koperasi pendaftar baru)
        └── QC Lab Management (Form input parameter kimia nilam & penerbit CoA digital)
```

### Alasan Perubahan:
1. **Pemisahan Konteks Kerja:** Supplier tidak perlu melihat keranjang belanja atau tautan pelacakan pengadaan buyer di Navbar. Buyer juga tidak perlu melihat aksi input batch koperasi. Hal ini mengurangi gangguan mental (*mental clutter*).
2. **Keterbacaan Struktur:** Memindahkan aksi operasional ke dalam wilayah masing-masing sub-dasbor membuat Navbar publik tetap bersih dan berfokus pada konversi penjualan komoditas.

---

## 5. Alur Pengguna yang Dioptimalkan (Improved User Flow)

### Buyer Flow:
```
Register / Login
      ↓
Marketplace / Smart Matching (Euclidean skoring kriteria industri)
      ↓
Product Detail (Analisis nilai PA% & Kadar Air via Radar/Horizontal Chart)
      ↓
Validasi Digital CoA & Traceability (Melihat peta GPS kebun penyuling)
      ↓
Add to Cart / Request RFQ (Negosiasi harga kustom)
      ↓
Checkout & Escrow Payment (Memilih kargo logistik domestik & bayar via Midtrans)
      ↓
Shipment Tracking (Pantau pergerakan fisik drum minyak nilam)
      ↓
Confirm Receipt / Release Fund (Dana dilepas ke wallet supplier)
```

### Supplier Flow:
```
Register (Default: status PENDING)
      ↓
Ditinjau oleh Admin (Dasbor Supplier terkunci dari aksi input batch)
      ↓
Akun Disetujui (APPROVED)
      ↓
Dashboard Terbuka → Klik "+ Tambah Batch Baru"
      ↓
Isi Form Wizard (Volume, Lahan, Tanggal Panen) → Submit (Status: IN_LAB)
      ↓
Kirim Sampel Fisik ke Hub Valam
      ↓
Diverifikasi Lab oleh Admin (Input PA%, Kadar Air, Indeks Bias, dsb.)
      ↓
CoA Terbit & Status batch berubah otomatis menjadi VERIFIED
      ↓
Produk Tayang Secara Instan di Marketplace (Katalog Publik)
```

### Admin Flow:
```
Login Admin
      ↓
Overview Admin Dashboard
      ↓
Supplier Verification (Setujui pendaftaran koperasi baru)
      ↓
QC Lab Queue (Lihat daftar batch masuk status IN_LAB)
      ↓
Input Parameter Lab & Klik "Terbitkan CoA"
      ↓
System updates batch status to VERIFIED & notifies Supplier
```

---

## 6. Struktur Halaman Berbasis Peran (Role-Based Page Structure)

### A. Public (Tamu / Pengunjung)
* **Landing Page:** Fokus mengomunikasikan proposisi nilai (*pure patchouli oil*), peta penyebaran koperasi atsiri mitra, statistik transaksi transparan, dan navigasi login.
* **Marketplace Catalog:** Akses terbuka mencari produk nilam bersertifikat dengan penyaringan (*filtering*) parameter kimia.
* **Traceability Portal:** Masukkan ID Batch atau scan QR untuk melihat asal-usul minyak nilam dari kebun hingga siap jual.

### B. Buyer (Pembeli Manufaktur/UMKM)
* **Dasbor Utama (Overview):** Menampilkan ringkasan total pembelian (kg), jumlah pesanan aktif, bagan status logistik, dan aktivitas RFQ terakhir.
* **Smart Matching:** Masukkan kriteria kebutuhan industri (PA% minimum, Moisture% maksimum, volume yang dibutuhkan, anggaran) untuk mendapatkan urutan batch terbaik.
* **RFQ Center:** Kelola pengajuan harga/volume kustom dengan status penawaran (*sent, under review, accepted, paid*).
* **Orders (Riwayat Pesanan):** Daftar transaksi lengkap dengan tombol unduh Invoice, sertifikat CoA digital tersemat, dan log pelacakan kurir logistik.
* **Profile Settings:** Pengaturan profil institusi buyer.

### C. Supplier (Koperasi Atsiri)
* **Dasbor Utama (Overview):** Tampilan visual empat metrik utama: Stok Terverifikasi, Menunggu QC, Volume Aktif Total, dan Saldo Wallet. Ditambah grafik garis tren penjualan bulanan.
* **Inventory (Inventori & Batch):** Tabel pengelolaan stok fisik produk nilam beserta tombol aksi pencetakan label QR Code.
* **Batch Management (Add Batch):** Form wizard 3 langkah yang sederhana dan responsif di seluler (memudahkan ketua koperasi menginput data di lapangan/gudang).
* **Incoming Orders (Orders):** Daftar pesanan masuk dan input logistik.
* **Wallet (Dompet Keuangan):** Indikator saldo siap cair dan formulir penarikan dana instan terintegrasi rekening bank lokal.
* **Profile Settings:** Pengaturan profil koperasi supplier.

### D. Admin (Tim Operasional Valam)
* **Dasbor Utama (Overview):** Notifikasi tindakan mendesak (*pending actions list*), volume transaksi harian, dan metrik kesehatan ekosistem marketplace.
* **QC Management (QC Lab):** Panel input hasil pengujian kromatografi gas sampel minyak nilam dari laboratorium Hub Valam.
* **Supplier Verification:** Daftar koperasi baru yang mendaftar beserta tinjauan dokumen legalitas hukum.
* **User Management:** Daftar seluruh akun terdaftar.
* **Product Management:** Moderasi listing batch aktif.
* **Transaction Management:** Monitoring status pembayaran escrows dan pengapalan.

---

## 7. Redesain Dasbor (Dashboard Redesign)

### Dasbor Supplier
* **Primary Goal:** Memantau status pengujian laboratorium sampel batch terbaru dan mengelola pencairan dana penjualan.
* **Important Information (Tingkat 1):** Saldo Wallet (Tersedia), Jumlah Batch berstatus `IN_LAB`, dan Volume Terverifikasi (Kg).
* **Primary Action:** Tombol besar "+ Tambah Batch Baru" (Hanya aktif jika status akun supplier telah disetujui admin).
* **Secondary Information:** Tabel ringkasan pesanan masuk terbaru yang perlu diproses pengirimannya.

### Dasbor Buyer
* **Primary Goal:** Menemukan suplai minyak nilam murni bersertifikat yang konsisten untuk formula aroma/kosmetik mereka.
* **Important Information (Tingkat 1):** Jumlah Pesanan Aktif, Status Pengiriman, dan Tombol Pintas ke Fitur Smart Matching.
* **Primary Action:** Aksi cari suplai atau buka form pencocokan spesifikasi industri (*Smart Match*).
* **Secondary Information:** Histori transaksi pengadaan bahan baku bulanan.

### Dasbor Admin
* **Primary Goal:** Menjaga keandalan rantai pasok dan kelayakan transaksi dalam ekosistem marketplace.
* **Important Information (Tingkat 1):** Antrean QC Lab Aktif, Pengajuan Akun Baru Pending, dan Pengaduan Transaksi (Dispute).
* **Primary Action:** Persetujuan Verifikasi Akun & Masukan Hasil Uji Lab.
* **Secondary Information:** Log aktivitas transaksi harian.

---

## 8. Penerapan Hukum UX (Applying UX Laws)

* **Hukum Jakob (Jakob's Law):**
  * Tata letak marketplace Valam menggunakan pola e-commerce B2B standar industri (filter di panel kiri, grid produk di kanan, dan keranjang belanja di pojok kanan atas) agar pembeli langsung memahami navigasi belanja tanpa perlu panduan tambahan.
* **Hukum Hick (Hick's Law):**
  * Mempersempit pilihan tindakan pada menu header global menjadi 4 link terfokus saat pengguna masuk (*Home, Marketplace, Dashboard, Cart*). Fitur operasional yang kompleks dikelompokkan ke dalam tab navigasi sub-dasbor yang rapi.
* **Hukum Fitts (Fitts's Law):**
  * Tombol aksi utama (seperti *Submit Batch, Kirim Sampel, Bayar Sekarang*) dibuat melintang penuh (*full-width*) di perangkat seluler dengan tinggi area ketuk minimum 48px untuk meminimalkan kesalahan ketukan jari pengguna di lapangan.
* **Recognition Over Recall (Pengenalan dibanding Mengingat):**
  * Parameter utama kualitas produk (PA% & Kadar Air) diilustrasikan dengan lencana indikator warna (*badge colors*) dan grafik visual horizontal sederhana, bukan hanya angka numerik mentah di detail halaman.
* **Aesthetic-Usability Effect:**
  * Antarmuka didesain menggunakan palet warna premium khas atsiri (Emerald Green, Gold accents, dan Zinc gray) serta tipografi serif klasik untuk logo/tajuk yang meningkatkan tingkat kepercayaan pengguna.

---

## 9. Desain Kepercayaan & Kredibilitas (Trust & Credibility Design)

Sebagai platform B2B managed-marketplace, kepercayaan mutu fisik minyak atsiri nilam adalah kunci utama transaksi.

### Komponen UI Kredibilitas yang Diwajibkan:
1. **Verified Batch Badge:**
   * Lencana hijau dengan ikon centang pelindung (`ShieldCheck`) yang disematkan pada setiap produk nilam di katalog setelah CoA divalidasi oleh admin lab.
2. **Interactive Chemical Parameter Grid:**
   * Di halaman detail produk, parameter kimia tidak hanya berupa teks biasa melainkan tabel visual perbandingan standar mutu SNI (Standar Nasional Indonesia) dengan hasil pengujian lab batch tersebut:
     * *Patchouli Alcohol (PA):* **32.5%** (Standar SNI: Min 30% — **Sesuai**)
     * *Kadar Air (Moisture):* **1.2%** (Standar SNI: Maks 1.5% — **Sesuai**)
3. **Digital CoA Previewer:**
   * Komponen kartu visual sertifikat analisis di halaman detail yang menampilkan stempel resmi, tanda tangan digital kepala lab Valam, dan tombol unduh PDF resmi.
4. **Interactive Traceability Timeline:**
   * Tampilan peta GPS kebun terintegrasi Google Maps dan lini masa perjalanan fisik minyak nilam (Panen di Lahan $\rightarrow$ Penyulingan Koperasi $\rightarrow$ Pengujian Mutu Hub Valam $\rightarrow$ Pengiriman ke Buyer).

---

## 10. Pencegahan Kesalahan & Umpan Balik (Error Prevention & Feedback)

### A. Umpan Balik Formulir Tambah Batch (Supplier Form Wizard)
* **Validasi Real-time:** Input volume nilam akan memberikan peringatan merah instan jika pengguna memasukkan angka `0` atau angka negatif.
* **Informasi Batas Harga:** Saat mengisi harga per Kg, sistem menampilkan rentang estimasi harga pasar nilam saat ini (misal: *Rp 850.000 - Rp 1.100.000 / Kg*) untuk mencegah supplier salah mengetik jumlah angka nol (contoh: menulis Rp 9.000.000 alih-alih Rp 900.000).

### B. Notifikasi Tindakan & Empty States
* **Empty State Terstruktur:** Ketika tabel pesanan atau inventori kosong, sistem tidak menampilkan halaman putih polos, melainkan grafis ilustrasi minimalis disertai tombol CTA penjelas:
  * *Before:* Halaman putih kosong dengan tulisan "Tidak ada pesanan".
  * *After:* *"Belum ada pesanan masuk. Pastikan kualitas stok Anda selalu diperbarui untuk menarik perhatian pembeli."* (Disertai tombol **"Lihat Inventori Anda"**).

---

## 11. Desain Responsif (Responsive Design)

Platform dirancang mengikuti pendekatan *Mobile-First* dengan penyesuaian tata letak grid cairan (*fluid design grid*):
* **Desktop (1280px+):** Menampilkan dasbor dengan panel data tabel penuh, grafik radar kimia interaktif, dan sidebar filter marketplace yang selalu terbuka di sebelah kiri.
* **Tablet (768px - 1024px):** Menu filter marketplace disembunyikan ke dalam tombol laci geser (*drawer*). Grafik radar beralih ke representasi tabel visual dua kolom yang ringkas.
* **Mobile (360px - 767px):** Sub-navigasi dasbor horizontal menggunakan fitur *swipe-scrollable* (bisa digeser ke samping). Tombol tindakan penting (seperti Checkout atau Tambah Batch) dibuat mengambang (*sticky floating CTA*) di dasar layar agar mudah dijangkau satu jempol.

---

## 12. Audit Aksesibilitas (Accessibility Audit)

* **Rasio Kontras Warna:** Semua teks pada tombol penting (seperti teks hitam `emerald-950` di atas tombol emas `gold-500`) memenuhi standar kontras minimum **4.5:1** sesuai pedoman WCAG 2.1 AA.
* **Navigasi Keyboard:** Semua elemen interaktif (form input, menu tarik-turun, tombol filter) dapat ditelusuri menggunakan tombol `Tab` dengan indikator fokus (*focus ring*) hijau yang terlihat jelas.
* **Alt Text Dinamis:** Semua gambar memiliki alt text yang jelas dan informatif.

---

## 13. Rekomendasi Sistem Komponen (Component Design System)

### A. Common Components
* **Button:** Emerald/Gold rounded-xl button.
* **Card:** Border-zinc-200 with soft shadows.
* **Status Badges:** Green/Emerald for verified, Yellow/Amber for processing, Zinc/Gray for drafts.

### B. Marketplace Components
* **Product Card:** Shows PA%, verified badge, price/kg, and "View Journey" button.
* **Certificate Viewer:** Displays chemical signature and official lab seal.

---

## 14. Arsitektur Sistem Akhir (Final Recommended Architecture)

Peta jalan navigasi sistem direkomendasikan memiliki hierarki berikut:

```
                  [ PUBLIC LANDING PAGE ]
                             │
            ┌────────────────┴────────────────┐
     [ MARKETPLACE ]                 [ AUTHENTICATION ]
            │                                 │
     [ PRODUCT DETAIL ]               [ ROLE CHECK ]
            │                                 │
     [ DIGITAL CoA ]        ┌─────────────────┼─────────────────┐
            │               │                 │                 │
    [ TRACEABILITY MAP ] [ BUYER ]      [ SUPPLIER ]       [ ADMIN ]
                            │                 │                 │
                         [ DASHBOARD ]     [ DASHBOARD ]     [ DASHBOARD ]
                            ├── Matching      ├── Inventory     ├── QC Queue
                            ├── RFQ           ├── Add Batch     ├── Verification
                            └── Orders        ├── Orders        └── Transactions
                                              └── Wallet
```

---

## 15. Panduan Akhir Peningkatan UX (Final UX Guideline)

1. **Prioritas Informasi Terbaca:** Selalu tampilkan data analitis mutu (PA%, Kadar Air) di atas data non-teknis.
2. **Kemandirian Peran:** Pastikan tidak ada halaman dasbor supplier yang bocor ke dasbor buyer.
3. **Pemberitahuan Status yang Proaktif:** Gunakan warna lencana status (*status badges*) yang konsisten di semua halaman.
4. **Penanganan Kegagalan yang Ramah:** Sediakan petunjuk solusi tindakan yang jelas pada setiap pesan kesalahan dan halaman kosong (*empty state*).
