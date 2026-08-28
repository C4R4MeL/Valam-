# Ringkasan Struktur Halaman & Fitur Projek Valam (B2B Patchouli Oil)

Dokumen ini merangkum seluruh halaman yang ada pada aplikasi, membaginya secara detail per halaman dari sudut pandang **Frontend (UI/UX)** dan **Backend (API & Logika Database)** untuk mempermudah peninjauan (*review*).

---

## 1. Landing Page (Beranda)
*   **Frontend (UI/UX):**
    *   *Path:* `frontend/src/app/[locale]/page.tsx`
    *   *Deskripsi:* Halaman depan utama. Dilengkapi Hero Section dengan transisi *fade* gambar latar belakang, animasi partikel emas (*gold particles*), **Glassmorphism Stats Bar** di bagian bawah, penjelasan sistem ekosistem, serta **Grid 2x2 Visual Feature Cards** (Smart Matching, Lab-Verified CoA, Traceability, Live RFQ) yang menampilkan mockup visual.
*   **Backend (API & Database):**
    *   *Path:* `/products` & `/users` (untuk kalkulasi data ringkasan di Stats Bar).
    *   *Fungsi:* Fetching statistik total supplier aktif, transaksi sukses, dan total ekspor minyak nilam yang diverifikasi.

## 2. Login Page (Masuk)
*   **Frontend (UI/UX):**
    *   *Path:* `frontend/src/app/[locale]/(auth)/login/page.tsx`
    *   *Deskripsi:* Form login minimalis dengan validasi form (email dan password), penanganan error (contoh: password salah), serta loading states ketika proses autentikasi sedang berjalan.
*   **Backend (API & Database):**
    *   *Path:* `/auth/login` (POST)
    *   *Fungsi:* Memverifikasi email dan password (menggunakan bcrypt), mencocokkan kredensial di database, membuat token JWT, dan mengembalikan data pengguna beserta hak aksesnya (*role*).
    *   *Model DB:* `User` (field: `email`, `password`, `role_id`).

## 3. Register Page (Daftar)
*   **Frontend (UI/UX):**
    *   *Path:* `frontend/src/app/[locale]/(auth)/register/page.tsx`
    *   *Deskripsi:* Pilihan peran pendaftaran (*Buyer* atau *Supplier*). Formulir pendaftaran bersifat dinamis: jika memilih *Supplier*, form akan memunculkan kolom profil badan usaha/perusahaan (NPWP, Nama PT/CV, Legalitas).
*   **Backend (API & Database):**
    *   *Path:* `/auth/register` (POST)
    *   *Fungsi:* Membuat entri `User` baru (status `pending` secara bawaan sebelum divalidasi admin) dan mengisi tabel relasi `Profile`.
    *   *Model DB:* `User`, `Profile`, `Role` (relasi `onDelete: Cascade` pada profil).

## 4. Marketplace Page
*   **Frontend (UI/UX):**
    *   *Path:*
        *   Daftar Produk: `frontend/src/app/[locale]/marketplace/page.tsx`
        *   Detail Produk: `frontend/src/app/[locale]/marketplace/product/[id]/page.tsx`
    *   *Deskripsi:* Halaman pencarian produk minyak nilam yang siap dijual oleh para supplier terverifikasi. Memiliki filter dinamis berdasarkan lokasi asal (*Origin*), Kadar PA (Patchouli Alcohol)%, Kadar Air (*Moisture*), Rentang Harga, dan Volume. Detail produk menampilkan spesifikasi detail, sertifikat keaslian QC, dan informasi detail supplier.
*   **Backend (API & Database):**
    *   *Path:* `/products` (GET), `/products/:id` (GET)
    *   *Fungsi:* Mengambil daftar produk dengan status `APPROVED` (telah lulus sensor QC admin) beserta parameter analisis laboratoriumnya.
    *   *Model DB:* `Product` (relasi ke `ProductParameter`, `QcResult`, `Certificate`, `User` sebagai supplier).

## 5. Shopping Cart & Checkout
*   **Frontend (UI/UX):**
    *   *Path:*
        *   Keranjang Belanja: `frontend/src/app/[locale]/cart/page.tsx`
        *   Checkout: `frontend/src/app/[locale]/checkout/page.tsx`
    *   *Deskripsi:* Mengelola kuantitas belanja minyak nilam (dalam Kg). Pada halaman checkout, pembeli mengisi alamat pengiriman, menghitung total biaya logistik, memilih metode pembayaran B2B bank transfer/fintech, dan menekan tombol buat pesanan.
*   **Backend (API & Database):**
    *   *Path:* `/cart` (GET, POST, DELETE, PUT), `/orders` (POST)
    *   *Fungsi:* Menyimpan keranjang belanja persisten user. Saat checkout, sistem mengunci stok produk (`available_volume_kg`), menghitung harga, memicu pembuatan entri `Order`, dan membuat rincian item pesanan `OrderItem`.
    *   *Model DB:* `CartItem`, `Order`, `OrderItem`, `Payment`.

## 6. MCDM Smart Matching
*   **Frontend (UI/UX):**
    *   *Path:*
        *   Halaman Form: `frontend/src/app/[locale]/matching/page.tsx`
        *   Dashboard Hasil: `frontend/src/app/[locale]/dashboard/buyer/matching/page.tsx`
    *   *Deskripsi:* Halaman input kriteria oleh Buyer (Volume target, Kadar PA%, Batas Moisture, dan Budget per kg). Sistem akan memproses dan langsung mencocokkan dengan stok produk aktif di pasaran dan menampilkan rekomendasi dengan persentase skor kecocokan tertinggi.
*   **Backend (API & Database):**
    *   *Path:* `/matching` (POST)
    *   *Fungsi:* Melakukan kalkulasi matematis *Multi-Criteria Decision Making* (MCDM) berbasis *Euclidean Distance* membandingkan input kebutuhan dengan data parameter produk riil milik supplier. Mengembalikan daftar produk terurut berdasarkan skor kecocokan (0.00 - 1.00).
    *   *Model DB:* `Product`, `ProductParameter`.

## 7. Traceability (Keterlacakan Digital)
*   **Frontend (UI/UX):**
    *   *Path:* `frontend/src/app/[locale]/traceability/[batchId]/page.tsx`
    *   *Deskripsi:* Peta interaktif yang dapat diakses oleh publik/pembeli. Peta ini menunjukkan timeline pergerakan spasial (koordinat GPS) minyak nilam, mulai dari koordinat kebun petani, gudang distilasi lokal, proses pengecekan di laboratorium, hingga pelabuhan keberangkatan.
*   **Backend (API & Database):**
    *   *Path:* `/trace/:batchId` (GET)
    *   *Fungsi:* Fetch semua data log aktivitas logistik spasial yang direkam berdasarkan ID batch produk.
    *   *Model DB:* `TraceLog` (field: `event_type`, `location_name`, `gps_latitude`, `gps_longitude`, `event_date`).

## 8. Buyer Dashboard (Dashboard Pembeli)
*   **Frontend (UI/UX):**
    *   *Path:*
        *   Overview: `frontend/src/app/[locale]/dashboard/buyer/page.tsx`
        *   Pesanan Saya: `frontend/src/app/[locale]/dashboard/buyer/orders/page.tsx`
        *   Buat RFQ Baru & List RFQ: `frontend/src/app/[locale]/dashboard/buyer/rfq/page.tsx`
    *   *Deskripsi:* Halaman pemantauan aktivitas bagi Buyer. Berisi ringkasan transaksi, pelacakan proses pesanan saat ini (*Shipment tracking*), serta antarmuka untuk membuat dokumen RFQ baru jika produk yang mereka butuhkan tidak tersedia di pasar terbuka.
*   **Backend (API & Database):**
    *   *Path:* `/orders/buyer/:userId` (GET), `/rfq` (POST, GET)
    *   *Fungsi:* Menyajikan riwayat transaksi pesanan milik pembeli, memperbarui status pengiriman barang dari pihak kurir, dan merekam data ajuan RFQ dari buyer.
    *   *Model DB:* `Order`, `Shipment`, `RfqRequest` (dengan status `SENT`, `RESPONDED`, dll).

## 9. Supplier Dashboard (Dashboard Penjual)
*   **Frontend (UI/UX):**
    *   *Path:*
        *   Overview: `frontend/src/app/[locale]/dashboard/supplier/page.tsx`
        *   Manajemen Batch (Inventaris): `frontend/src/app/[locale]/dashboard/supplier/inventory/page.tsx`
        *   Tambah Batch Baru: `frontend/src/app/[locale]/dashboard/supplier/add-batch/page.tsx`
        *   RFQ Masuk: `frontend/src/app/[locale]/dashboard/supplier/rfq/page.tsx`
        *   Dompet (Keuangan): `frontend/src/app/[locale]/dashboard/supplier/wallet/page.tsx`
*   **Backend (API & Database):**
    *   *Path:* `/products` (POST untuk menambah batch), `/rfq/respond` (POST untuk menanggapi RFQ), `/wallet` (GET) dan `/wallet/withdraw` (POST).
    *   *Fungsi:*
        *   Menyimpan batch produk baru dengan status `DRAFT` (belum divalidasi admin).
        *   Memungkinkan supplier mengirimkan penawaran harga balik (*Counter-Offer*) terhadap RFQ dari buyer.
        *   Menampilkan transaksi masuk hasil penjualan dan mengajukan permohonan pencairan uang (*withdrawal*).
    *   *Model DB:* `Product`, `RfqResponse`, `Wallet`, `WalletTransaction`, `Withdrawal`.

## 10. Admin Dashboard
*   **Frontend (UI/UX):**
    *   *Path:*
        *   Overview: `frontend/src/app/[locale]/dashboard/admin/page.tsx`
        *   Verifikasi Supplier: `frontend/src/app/[locale]/dashboard/admin/suppliers/page.tsx`
        *   Manajemen QC (Hasil Lab): `frontend/src/app/[locale]/dashboard/admin/qc/page.tsx`
    *   *Deskripsi:* Halaman pengawasan penuh. Admin menyetujui akun supplier baru, mengisi hasil uji lab fisik minyak nilam yang dikirim supplier (PA%, Moisture, optical rotation, dll), dan mempublikasikan sertifikat analisis digital.
*   **Backend (API & Database):**
    *   *Path:* `/admin/suppliers/:id` (PUT untuk ganti status), `/qc` (POST)
    *   *Fungsi:* Verifikasi supplier baru, merekam data uji klinis lab QC ke database, mengubah status produk dari `DRAFT` menjadi `APPROVED` secara otomatis, serta menerbitkan nomor `Certificate` beserta QR Code.
    *   *Model DB:* `User` (untuk update status verifikasi), `QcResult`, `Certificate`.

---
*Silakan review pemetaan halaman di atas sebelum melanjutkan ke proses berikutnya!*
