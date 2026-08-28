# Ringkasan Fitur Platform Valam (B2B Patchouli Oil)

Dokumen ini merangkum seluruh fitur dan modul yang telah berhasil dibangun pada sistem Valam (Frontend & Backend). Anda dapat menggunakan dokumen ini sebagai panduan atau *checklist* untuk *review*.

---

## 1. Autentikasi & Manajemen Pengguna (Auth & Profiles)
*   **Sistem Registrasi & Login:** Mendukung pembuatan akun berbasis peran (Role-Based).
*   **Multi-Role System:** Terdapat 3 peran utama di dalam ekosistem:
    *   **Supplier / Penyuling Lokal:** Pihak yang menambahkan stok minyak nilam.
    *   **Buyer / Global Buyer:** Pihak yang mencari dan membeli bahan baku.
    *   **Admin:** Mengelola keseluruhan transaksi, verifikasi pengguna, dan *Quality Control* (QC).
*   **Integrasi Supabase & JWT:** Menjaga keamanan sesi pengguna dan data.

## 2. Fitur Khusus Supplier (Supplier Dashboard)
*   **Manajemen Inventaris (Inventory):** Supplier dapat menambahkan *batch* minyak nilam baru beserta spesifikasinya (Volume, Kadar PA%, Moisture).
*   **Upload Certificate of Analysis (CoA):** Bukti lab independen diunggah pada setiap *batch*.
*   **Manajemen Pesanan (Orders):** Memantau pesanan masuk dari *buyer*.
*   **Manajemen RFQ Masuk:** Menanggapi penawaran harga (*bidding/counter-offer*) dari *buyer*.
*   **Digital Wallet (Dompet):** Memantau saldo pendapatan hasil penjualan.

## 3. Fitur Khusus Buyer (Buyer Dashboard & Marketplace)
*   **Marketplace Publik:** Melihat katalog minyak nilam premium yang telah terkurasi.
*   **Sistem Keranjang & Checkout (Cart & Payment):** Proses transaksi pembelian langsung (*Direct Trading*).
*   **Live RFQ (Request for Quotation):** Jika harga atau spesifikasi belum sesuai, *buyer* dapat mengajukan penawaran harga dan bernegosiasi secara *live* melalui sistem tanpa harus keluar dari platform.
*   **Sistem Pemantauan Pesanan (Order Tracking):** Memantau status pengiriman dari supplier.

## 4. Fitur Cerdas (Smart Features)
*   **Algoritma MCDM Smart Matching:**
    *   Sistem rekomendasi otomatis yang mempertemukan *buyer* dan *supplier*.
    *   Perhitungan matematis berbasis *Euclidean Distance* menggunakan profil parameter seperti Budget, Kebutuhan Volume, Target Kadar PA%, dan lain-lain.
    *   Menghilangkan bias dan memastikan transaksi paling optimal.
*   **Sistem Traceability (Keterlacakan):**
    *   Pelacakan digital 100% dari setiap *batch* minyak nilam.
    *   Data pergerakan barang mulai dari koordinat lokasi kebun/petani di Sumatera hingga ke tahap pengiriman (*Shipment*).

## 5. Fitur Admin & Pengawasan (Admin Dashboard)
*   **Verifikasi Supplier:** Memastikan hanya entitas terpercaya yang beroperasi.
*   **Manajemen Quality Control (QC):** Tim penilai memeriksa kecocokan antara produk fisik dan dokumen CoA sebelum memberikan label "Lab-Verified".

## 6. Antarmuka (UI/UX) Frontend
*   **Dukungan Multi-Bahasa (Localization):** Sistem bahasa Inggris (EN) dan Indonesia (ID).
*   **Modern Design (Bento Cards & Glassmorphism):** Penggunaan animasi halus (*framer-motion*), penyajian informasi berbasis kartu visual yang konsisten, dan transisi elegan bebas *lag*.

---
*Silakan tinjau seluruh fungsionalitas ini. Jika ada fitur tambahan yang perlu dibuat atau dioptimasi, beri tahu saya!*
