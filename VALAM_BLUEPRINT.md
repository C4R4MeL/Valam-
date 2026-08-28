# Project Structure & User Role Specification - Valam Platform

Buat aplikasi bernama **Valam**, yaitu B2B Managed Marketplace untuk minyak nilam Indonesia yang menghubungkan supplier minyak nilam, buyer industri, dan admin sebagai pihak verifikasi kualitas.

Valam bukan sekadar marketplace, tetapi platform yang membangun kepercayaan melalui:
- Quality Verification
- Digital Certificate of Analysis (CoA)
- Batch Traceability
- Transparent Supply Chain

# 1. Public Landing Page (Beranda)
Landing Page adalah halaman pertama yang dilihat oleh semua pengunjung sebelum login.

Tujuan:
- Memperkenalkan Valam.
- Menjelaskan solusi yang diberikan.
- Membangun kepercayaan.
- Mengarahkan user untuk menjadi Supplier atau Buyer.

Struktur Landing Page:
## Hero Section
Konten:
Headline: "Connecting Verified Patchouli Oil From Indonesia To Global Industries"
Subheadline: "Platform B2B yang menghubungkan supplier minyak nilam terpercaya dengan industri parfum dan kosmetik melalui verifikasi kualitas dan transparansi rantai pasok."

Visual:
- Perkebunan nilam Indonesia.
- Petani.
- Botol minyak nilam.
- Elemen teknologi seperti data, QR traceability.

CTA Button:
Primary: "Find Verified Oil"
Secondary: "Become Supplier"

---
# About Valam Section
Menjelaskan:
- Masalah industri minyak nilam.
- Kurangnya transparansi kualitas.
- Sulitnya buyer menemukan supplier terpercaya.

Solusi Valam:
- Marketplace berbasis kualitas.
- Digital CoA.
- Traceability.

---
# How It Works Section
Tampilkan alur:
Supplier ↓ Quality Verification ↓ Digital Certificate ↓ Buyer Discovery ↓ Transaction
Gunakan visual step-by-step.

---
# Quality Assurance Section
Menampilkan fitur:
- Chemical Parameter
- PA Percentage
- Purity
- Moisture Level
- Digital Certificate of Analysis

Tujuan: Meyakinkan buyer bahwa produk telah diverifikasi.

---
# Traceability Section
Menjelaskan:
Buyer dapat mengetahui:
- Asal produk.
- Batch produk.
- Lokasi produksi.
- Riwayat perjalanan produk.

Visual: QR Code + Supply Chain Map.

---
# Marketplace Preview Section
Menampilkan preview produk tanpa login.

Contoh card:
Product: Patchouli Oil Aceh
PA: 95%
Purity: Verified
Origin: Aceh Indonesia
Certificate: Available

Tujuan: Menunjukkan kemampuan platform.

---
# Role Selection Section
Arahkan user memilih:

## Buyer
CTA: "Find Verified Patchouli Oil"
Menuju: Login/Register Buyer

## Supplier
CTA: "Join as Supplier"
Menuju: Login/Register Supplier

---
# Authentication
Halaman: Login, Register
Saat Register user memilih role:
1. Supplier
2. Buyer

Admin tidak melakukan registrasi publik.

---
# 2. Buyer Role
Setelah login, Buyer masuk ke Buyer Dashboard.

Sidebar:
- Dashboard
- Marketplace
- Smart Matching
- Product Detail
- My Orders
- RFQ Request
- Company Profile
- Settings

## Buyer Dashboard
Menampilkan:
- Rekomendasi produk.
- Order terakhir.
- Produk favorit.
- Status transaksi.

## Marketplace
Fungsi: Buyer mencari minyak nilam.
Fitur: Search, Filter PA%, Filter purity, Filter origin, Filter volume.
Buyer dapat: Melihat detail produk, Melihat CoA, Melihat traceability, Membeli produk.

## Product Detail
Menampilkan: Nama produk, Supplier, Batch, Chemical parameter, Digital CoA, Origin, QR Traceability.

## Smart Matching
Buyer memasukkan kebutuhan: Volume, Minimum PA%, Kualitas, Kebutuhan industri.
Sistem memberikan rekomendasi supplier.

## Orders
Menampilkan: Pending, Processing, Shipping, Completed.

---
# 3. Supplier Role
Setelah login, Supplier masuk ke Supplier Dashboard.

Sidebar:
- Dashboard
- Inventory
- Add Batch
- Quality Check
- Marketplace Preview
- Orders
- Wallet
- Company Profile
- Settings

## Supplier Dashboard
Menampilkan: Jumlah batch, Produk aktif, Status QC, Order masuk.

## Inventory
Supplier mengelola: Produk, Batch, Volume, Status verifikasi.

## Add Batch
Supplier dapat menambahkan: Nama produk, Nomor batch, Volume, Asal kebun, Tanggal produksi, Data kualitas.

## Quality Check
Menampilkan: Draft ↓ Submitted ↓ Testing ↓ Verified ↓ Published

## Marketplace Preview
Supplier dapat melihat bagaimana produk tampil di marketplace, standar kualitas pasar, produk kompetitor.
Supplier hanya dapat melihat marketplace, tidak dapat melakukan checkout.

## Orders
Menampilkan: Pesanan buyer, Status pembayaran, Status pengiriman.

## Wallet
Menampilkan: Pendapatan, Transaksi selesai, Riwayat pembayaran.

---
# 4. Admin Role
Admin adalah pihak yang menjaga kepercayaan platform.

Dashboard Admin Sidebar:
- Dashboard
- Supplier Verification
- Product Management
- QC Management
- Certificate Management
- Transaction Monitoring
- Reports
- Settings

## Admin Dashboard
Menampilkan: Jumlah supplier, Jumlah buyer, Batch aktif, Produk verified, Transaksi.

## Supplier Verification
Admin: Memeriksa dokumen supplier, Approve/reject supplier.

## QC Management
Admin: Memeriksa batch, Input hasil laboratorium, Approve kualitas.
Output: Digital CoA.

## Product Management
Admin: Approve produk, Menyembunyikan produk, Mengelola listing.

## Transaction Monitoring
Admin: Memantau transaksi, Melihat aktivitas marketplace.

---
# Navigation Flow

Public User:
Landing Page ↓ Login/Register ↓ Select Role ↓ Dashboard sesuai role

Buyer:
Dashboard ↓ Marketplace ↓ Product Detail ↓ CoA & Traceability ↓ Order

Supplier:
Dashboard ↓ Add Batch ↓ QC Verification ↓ Marketplace Listing ↓ Receive Order

Admin:
Dashboard ↓ Verify Supplier ↓ Verify Product ↓ Manage Quality ↓ Monitor Transaction

---
# Design Requirement
Gunakan style:
- Modern B2B SaaS.
- Premium agriculture technology.
- Natural green + technology feeling.
- Clean dashboard.
- Professional marketplace.

Prioritaskan: Trust, Transparency, Quality verification, Global supply chain.
