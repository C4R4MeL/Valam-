# DEVELOPMENT PLAN — VALAM
## Platform B2B Managed-Marketplace Minyak Nilam

> **Versi:** 1.0 | **Tanggal:** 24 Juni 2026  
> **Repository:** [github.com/C4R4MeL/Valam-](https://github.com/C4R4MeL/Valam-.git)  
> **Referensi:** [PRD.md](file:///d:/UTU%20Awards%20Project/PRD.md) | [Design.md](file:///d:/UTU%20Awards%20Project/design.md)  
> **Status:** Blueprint — Siap untuk eksekusi development

---

## Daftar Isi

1. [Project Overview](#1-project-overview)
2. [Development Strategy](#2-development-strategy)
3. [Technology Stack Recommendation](#3-technology-stack-recommendation)
4. [System Architecture Overview](#4-system-architecture-overview)
5. [Development Roadmap](#5-development-roadmap)
6. [Sprint Planning](#6-sprint-planning)
7. [Database Development Plan](#7-database-development-plan)
8. [Backend API Planning](#8-backend-api-planning)
9. [Frontend Implementation Plan](#9-frontend-implementation-plan)
10. [Component Development Strategy](#10-component-development-strategy)
11. [Testing Strategy](#11-testing-strategy)
12. [Security Implementation](#12-security-implementation)
13. [Deployment Plan](#13-deployment-plan)
14. [Project Timeline](#14-project-timeline)
15. [Team Task Distribution](#15-team-task-distribution)
16. [Risk Management](#16-risk-management)
17. [Definition of Done](#17-definition-of-done)

---

## 1. Project Overview

### 1.1 Ringkasan Project

Valam adalah platform aplikasi web B2B *managed-marketplace* untuk komoditas minyak nilam (*patchouli oil*). Platform ini bertindak sebagai **trust infrastructure** yang mendigitalisasi rantai pasok dari koperasi penyuling hulu hingga industri pengguna hilir. Diferensiasi utama Valam terletak pada integrasi *built-in quality assurance* — setiap komoditas di etalase dijamin kemurniannya melalui visualisasi **Certificate of Analysis (CoA) digital** dan sistem pelacakan batch berbasis **QR Code**.

### 1.2 Tujuan Development

| # | Tujuan | Deskripsi |
|---|--------|-----------|
| 1 | **Digitalisasi Rantai Pasok** | Membangun sistem pencatatan inventori berbasis *batch* yang terstruktur untuk koperasi penyuling hulu |
| 2 | **Eliminasi Penipuan Mutu** | Mengimplementasikan modul Digital CoA dengan visualisasi parameter kimiawi dan tanda tangan digital admin |
| 3 | **Transparansi Asal-Usul** | Membangun sistem QR Code Traceability dengan log perjalanan batch dan koordinat GPS kebun sumber |
| 4 | **Transaksi B2B Digital** | Memfasilitasi checkout grosir skala kilogram dengan integrasi kalkulasi kargo domestik |
| 5 | **Smart Matching** | Mengimplementasikan algoritma Rule-Based MCDM untuk mencocokkan kebutuhan buyer dengan stok tersedia |

### 1.3 Scope MVP (Berdasarkan MoSCoW dari PRD)

| Prioritas | Fitur | Referensi PRD |
|-----------|-------|---------------|
| **Must Have** | B2B Catalog & Chemical Filters | F-01 |
| **Must Have** | Lab Verification & Digital CoA | F-03 |
| **Must Have** | QR Code Provenance Tracking | F-04 |
| **Must Have** | Batch Inventory System | F-02 |
| **Must Have** | Transaction Checkout | F-05 |
| **Should Have** | Rule-Based Smart Matching | F-06 |
| **Should Have** | Domestic E-Commerce Checkout | F-05 |
| **Should Have** | Shipment Status Tracker | F-08 |
| **Should Have** | Supplier Wallet Dashboard | F-09 |
| **Could Have** | RFQ Submission System | F-07 |
| **Won't Have** | Cross-Border Escrow & L/C | — |
| **Won't Have** | AI Price Forecasting | F-11 |
| **Won't Have** | Export Compliance Engine | F-10 |

### 1.4 Target Pengguna

| User | Karakteristik | Kebutuhan Utama |
|------|---------------|-----------------|
| **Supplier** (Koperasi Atsiri) | Literasi digital dasar, sensitif terhadap pencairan dana, berbadan hukum | Akses pasar premium, pencatatan stok mudah, visibilitas status QC, transparansi pencairan dana |
| **Buyer Lokal** (UMKM Parfum/Kosmetik) | Melek digital, sensitif mutu bahan, skala menengah | Jaminan kemurnian 100%, data parameter kimia, volume fleksibel (kg), transaksi e-commerce instan |
| **Buyer Global** (Fragrance Houses) | Korporasi analitis, kepatuhan EUDR, volume tonase | Data traceability GPS, stabilitas kualitas, dokumen ekspor, RFQ formal |
| **Admin** (Tim Valam) | Staf operasional hub pengumpul dan sistem terpusat | Konsol validasi akun, rekaman data lab, moderasi transaksi, monitoring platform |

### 1.5 Expected Outcome

Setelah MVP selesai, platform Valam harus mampu:

1. **Supplier** dapat mendaftarkan batch produksi, melihat status QC secara *live*, dan menerima pencairan dana penjualan.
2. **Buyer** dapat menjelajahi katalog berdasarkan parameter kimiawi, memvalidasi CoA digital, melacak asal-usul produk via QR, dan melakukan checkout grosir.
3. **Admin** dapat memvalidasi akun supplier, menginput hasil laboratorium, menerbitkan CoA digital, dan memoderasi transaksi.
4. Seluruh halaman responsif (desktop, tablet, mobile) sesuai spesifikasi Design.md.
5. Load time katalog < 2.5 detik dan Smart Matching merender hasil < 500ms (sesuai NFR PRD).

---

## 2. Development Strategy

### 2.1 Metodologi: Agile Scrum

| Parameter | Nilai | Alasan |
|-----------|-------|--------|
| **Framework** | Agile Scrum | Cocok untuk development iteratif dengan feedback loop pendek. Fitur dapat divalidasi per sprint tanpa menunggu seluruh sistem selesai. |
| **Sprint Duration** | 2 minggu (10 hari kerja) | Cukup panjang untuk menyelesaikan satu *feature slice* lengkap (frontend + backend + testing), cukup pendek untuk course-correction cepat. |
| **Total Sprint** | 6 Sprint (12 minggu) | Mencakup seluruh scope MVP dari foundation hingga deployment. |
| **Daily Standup** | 15 menit setiap hari kerja | Sinkronisasi progres, identifikasi blocker, koordinasi antar frontend/backend. |
| **Sprint Review** | Akhir setiap sprint | Demo working feature ke stakeholder. Validasi kesesuaian dengan PRD dan Design.md. |
| **Sprint Retrospective** | Akhir setiap sprint | Evaluasi proses, perbaikan workflow untuk sprint berikutnya. |

### 2.2 Development Cycle per Sprint

```
Sprint Planning (Hari 1)
    ↓
Development & Integration (Hari 2–8)
    ↓
Testing & Bug Fix (Hari 9)
    ↓
Sprint Review & Retrospective (Hari 10)
```

### 2.3 Sprint Overview

| Sprint | Nama | Fokus Utama | Durasi |
|--------|------|-------------|--------|
| Sprint 1 | **Foundation & Authentication** | Project setup, design system, autentikasi multi-role | Minggu 1–2 |
| Sprint 2 | **Marketplace Core** | Katalog B2B, product card, filter parameter kimia, product detail | Minggu 3–4 |
| Sprint 3 | **Quality Assurance System** | Digital CoA, QR Traceability, Admin QC management | Minggu 5–6 |
| Sprint 4 | **Transaction & Wallet** | Cart, checkout, order management, supplier wallet, shipment tracker | Minggu 7–8 |
| Sprint 5 | **Smart Matching & RFQ** | Algoritma MCDM, form kriteria, rekomendasi, modul RFQ | Minggu 9–10 |
| Sprint 6 | **Testing, Polish & Deployment** | Integration testing, UAT, performance optimization, deployment | Minggu 11–12 |

**Alasan urutan sprint:**
1. **Sprint 1 (Foundation)** harus pertama karena design system, database schema, dan authentication menjadi dependensi seluruh fitur.
2. **Sprint 2 (Marketplace)** kedua karena storefront adalah *core loop* yang harus berfungsi sebelum fitur QA dan transaksi.
3. **Sprint 3 (Quality)** bergantung pada data produk dari Sprint 2 — CoA dan traceability membutuhkan batch yang sudah ada.
4. **Sprint 4 (Transaction)** membutuhkan produk terverifikasi dari Sprint 3 agar flow checkout realistis.
5. **Sprint 5 (Smart Matching)** adalah fitur *Should Have* yang bergantung pada katalog dan data QC dari sprint sebelumnya.
6. **Sprint 6 (Testing)** terakhir untuk validasi end-to-end seluruh fitur terintegrasi.

---

## 3. Technology Stack Recommendation

### 3.1 Frontend

| Kategori | Teknologi | Alasan |
|----------|-----------|--------|
| **Framework** | **Next.js 14 (App Router)** | SSR/SSG untuk performa katalog (load time < 2.5 detik sesuai NFR). File-based routing mempercepat development multi-halaman (landing, marketplace, dashboard). Built-in API routes untuk prototyping. |
| **UI Library** | **React 18** | Komponen reusable untuk design system Valam. Ecosystem besar (Recharts untuk chart parameter kimia, react-qr-reader untuk scanner). |
| **CSS Framework** | **Tailwind CSS 3** | Sesuai spesifikasi NFR PRD yang menyebutkan Tailwind CSS untuk *responsive fluid design*. Utility-first cocok untuk design token Valam (spacing kelipatan 4px, custom color palette). |
| **Component Library** | **Shadcn/UI** | Komponen headless yang customizable sesuai design system Valam. Tidak opinionated — bisa disesuaikan dengan warna Forest Green (#2D6A4F) dan tipografi Inter. |
| **State Management** | **Zustand** | Lightweight (< 1KB), cocok untuk state sederhana (cart, user session, filter marketplace). Tidak butuh Redux karena sebagian besar state di-handle oleh server components Next.js. |
| **Form Management** | **React Hook Form + Zod** | React Hook Form untuk performance form wizard Supplier (3 langkah) dan form Smart Matching. Zod untuk schema validation yang terintegrasi dengan TypeScript. |
| **Chart Library** | **Recharts** | Diperlukan untuk radar chart parameter kimia di Product Detail dan grafik bar PA% di Product Card (sesuai Design.md section 6.3). |
| **Map Integration** | **Google Maps Embed / Leaflet** | Halaman QR Traceability membutuhkan embed peta koordinat kebun sumber. |
| **QR Code** | **qrcode.react** (generate) + **html5-qrcode** (scan) | Generate QR untuk batch dan scan QR oleh buyer sesuai user flow PRD. |

### 3.2 Backend

| Kategori | Teknologi | Alasan |
|----------|-----------|--------|
| **Framework** | **NestJS (TypeScript)** | Secara eksplisit disebut di NFR PRD. Architecture modular (modules, controllers, services) mendukung pemisahan domain (auth, product, QC, transaction). Mudah dimigrasikan ke microservices di masa depan sesuai NFR Scalability. |
| **API Architecture** | **RESTful API** | Sesuai kebutuhan MVP — endpoint CRUD standar untuk produk, batch, order. GraphQL ditunda karena over-engineering untuk fase awal. |
| **Authentication** | **JWT (JSON Web Token)** | Secara eksplisit diwajibkan di NFR Security PRD. Access token (15 menit) + Refresh token (7 hari) untuk session management. |
| **Authorization** | **RBAC (Role-Based Access Control)** | Tiga role jelas di PRD: Supplier, Buyer, Admin. Guard decorator di NestJS untuk proteksi endpoint berdasarkan role. |
| **File Storage** | **Multer + Cloud Storage** | Upload foto drum produk (Supplier), file CoA PDF (Admin). |
| **Email Service** | **Nodemailer / SendGrid** | Verifikasi email saat registrasi, notifikasi status batch. |
| **API Documentation** | **Swagger (OpenAPI)** | Auto-generate documentation dari NestJS decorators. Mempercepat koordinasi frontend-backend. |

### 3.3 Database

| Kategori | Teknologi | Alasan |
|----------|-----------|--------|
| **Database** | **PostgreSQL 16** | Secara eksplisit disebut di NFR PRD. Relational database yang mendukung 3NF, JSON column untuk data parameter kimia fleksibel, full-text search untuk katalog. |
| **ORM** | **Prisma** | Type-safe query builder yang terintegrasi dengan TypeScript/NestJS. Auto-generate migration, seeding, dan client. Schema-first approach mempermudah kolaborasi. |
| **Caching** | **Redis** | Cache katalog marketplace untuk load time < 2.5 detik. Session store untuk JWT refresh token. |
| **File Storage** | **Supabase Storage / AWS S3** | Penyimpanan file CoA PDF, foto produk, QR Code PDF. |

### 3.4 Infrastructure

| Kategori | Teknologi | Alasan |
|----------|-----------|--------|
| **Frontend Hosting** | **Vercel** | Native deployment untuk Next.js. Edge network untuk performa global (buyer global). Free tier memadai untuk MVP. |
| **Backend Hosting** | **Railway / Render** | Managed deployment untuk NestJS. PostgreSQL dan Redis tersedia sebagai add-on. Auto-scaling untuk NFR Availability 99.5%. |
| **Database Hosting** | **Supabase / Railway PostgreSQL** | Managed PostgreSQL dengan backup otomatis, monitoring, dan connection pooling. |
| **CI/CD** | **GitHub Actions** | Otomatisasi: lint → test → build → deploy pada setiap push ke branch `main` dan `staging`. |
| **Version Control** | **Git + GitHub** ([C4R4MeL/Valam-](https://github.com/C4R4MeL/Valam-)) | Branching strategy: `main` (production), `staging` (testing), `feature/*` (development). Repository sudah diinisialisasi di https://github.com/C4R4MeL/Valam-.git |
| **Monitoring** | **Sentry** (error tracking) + **Vercel Analytics** (performance) | Monitoring error production dan web vitals (LCP, FCP, CLS) untuk memastikan NFR Performance terpenuhi. |

---

## 4. System Architecture Overview

### 4.1 Diagram Arsitektur

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                               │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │   Buyer     │  │  Supplier   │  │    Admin    │  │  Public   │ │
│  │  Dashboard  │  │  Dashboard  │  │  Dashboard  │  │  (QR Scan)│ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘ │
│         │                │                │               │        │
│  ┌──────┴────────────────┴────────────────┴───────────────┴──────┐ │
│  │                    Next.js 14 (App Router)                    │ │
│  │          Server Components + Client Components                │ │
│  │              Tailwind CSS + Shadcn/UI                         │ │
│  └──────────────────────────┬────────────────────────────────────┘ │
└─────────────────────────────┼───────────────────────────────────────┘
                              │ HTTPS / REST API
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY LAYER                            │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    NestJS Backend                            │   │
│  │                                                              │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │   │
│  │  │   Auth   │ │ Product  │ │ Quality  │ │  Transaction  │  │   │
│  │  │  Module  │ │  Module  │ │  Module  │ │    Module     │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │   │
│  │  │ Matching │ │   RFQ    │ │  Wallet  │ │  Traceability │  │   │
│  │  │  Module  │ │  Module  │ │  Module  │ │    Module     │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │   │
│  │                                                              │   │
│  │           JWT Guard + RBAC Authorization                     │   │
│  │              Swagger API Documentation                       │   │
│  └──────────────────────┬───────────────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────────┐
          ▼               ▼                   ▼
┌─────────────┐  ┌────────────────┐  ┌────────────────┐
│ PostgreSQL  │  │     Redis      │  │  Cloud Storage │
│  Database   │  │   (Cache +     │  │   (S3/Supabase)│
│             │  │    Session)    │  │                │
│  - Users    │  │  - Katalog     │  │  - CoA PDF     │
│  - Products │  │    Cache       │  │  - Foto Produk │
│  - Batches  │  │  - JWT Refresh │  │  - QR Code PDF │
│  - QC Data  │  │  - Rate Limit  │  │                │
│  - Orders   │  │                │  │                │
│  - Wallet   │  │                │  │                │
└─────────────┘  └────────────────┘  └────────────────┘
                                              │
                                     ┌────────┴─────────┐
                                     ▼                  ▼
                            ┌──────────────┐   ┌──────────────┐
                            │ Google Maps  │   │ Payment      │
                            │ API          │   │ Gateway      │
                            │ (Traceability│   │ (Midtrans)   │
                            │  Peta Kebun) │   │              │
                            └──────────────┘   └──────────────┘
```

### 4.2 Alur Data Utama

**Alur Supplier → Admin → Buyer:**

```
Supplier mendaftarkan batch (volume, asal lahan, tanggal produksi)
    ↓ POST /api/products/batches
Batch tersimpan di PostgreSQL dengan status "DRAFT"
    ↓
Admin menerima notifikasi batch baru di antrian QC
    ↓ PUT /api/admin/qc/:batchId
Admin menginput hasil lab (PA%, Moisture, Specific Gravity, dll)
    ↓
Sistem otomatis generate Digital CoA + QR Code
    ↓ Status batch berubah menjadi "VERIFIED" → "ACTIVE"
Produk muncul di katalog marketplace
    ↓ GET /api/products (dengan filter parameter kimia)
Buyer menjelajahi katalog → melihat detail → checkout
    ↓ POST /api/orders
Order tercatat → Supplier menerima notifikasi → konfirmasi pengiriman
    ↓ PUT /api/orders/:id/shipment
Dana masuk wallet Supplier → withdrawal
```

### 4.3 Authentication Flow

```
Guest mengakses /register
    ↓
Pilih role: Supplier / Buyer
    ↓
Isi form sesuai role → POST /api/auth/register
    ↓
Server: hash password (bcrypt), simpan user, kirim email verifikasi
    ↓
User verifikasi email → POST /api/auth/verify-email
    ↓
User login → POST /api/auth/login
    ↓
Server: validasi credentials → issue Access Token (JWT, 15 menit) + Refresh Token (7 hari)
    ↓
Client menyimpan Access Token di memory, Refresh Token di httpOnly cookie
    ↓
Setiap request API: Access Token dikirim di header Authorization: Bearer <token>
    ↓
Server: JWT Guard memvalidasi token → RBAC Guard mengecek role permission
    ↓
Token expired → Client hit POST /api/auth/refresh → dapat Access Token baru
```

---

## 5. Development Roadmap

| Phase | Fitur | Deskripsi | Prioritas (MoSCoW) | Output |
|-------|-------|-----------|---------------------|--------|
| **Phase 1** | **Foundation & Auth** | Setup project, design system, database schema, autentikasi multi-role, landing page | Must Have | Register, Login, Role Management, Landing Page, Design System |
| **Phase 2** | **Marketplace Core** | Katalog B2B storefront, product card dengan parameter kimia, filter/sort, product detail, batch inventory (Supplier) | Must Have | Halaman Marketplace, Product Detail, Supplier Dashboard, Inventory Management |
| **Phase 3** | **Quality Assurance** | Digital CoA viewer, admin QC management, QR Code generation, traceability page publik, verification status tracker | Must Have | Digital CoA, QR Traceability, Admin QC Console, Verified Badge System |
| **Phase 4** | **Transaction System** | Cart & checkout B2B, order management, shipment tracking, supplier wallet & withdrawal, payment integration | Must Have + Should Have | Checkout Flow, Order Management, Wallet Dashboard, Shipment Tracker |
| **Phase 5** | **Smart Matching & RFQ** | Algoritma Rule-Based MCDM, form kriteria industri, tabel rekomendasi skor, modul RFQ submission | Should Have + Could Have | Smart Matching Page, RFQ Submission System |
| **Phase 6** | **Testing & Deployment** | Integration testing, UAT seluruh role, performance optimization, security audit, production deployment | — | Production-ready platform, dokumentasi API, laporan UAT |

---

## 6. Sprint Planning

---

### Sprint 1: Foundation & Authentication (Minggu 1–2)

#### Goal
Membangun fondasi teknis project: setup environment, implementasi design system Valam, database schema awal, sistem autentikasi multi-role, dan landing page.

#### Features
- Project setup (Next.js + NestJS + PostgreSQL + Prisma)
- Design system implementation (color palette, typography, spacing, shadows)
- UI base components (Button, Input, Card, Badge, Modal, Toast)
- Landing page (hero, cara kerja, statistik, trust pillars)
- Autentikasi: Register (multi-role), Login, Forgot Password
- Role-based authorization (Supplier, Buyer, Admin)

#### Frontend Tasks

| # | Task | Referensi Design.md | Estimasi |
|---|------|---------------------|----------|
| 1 | Setup Next.js 14 project dengan TypeScript, Tailwind CSS, Shadcn/UI | — | 4 jam |
| 2 | Implementasi CSS variables design token (color palette section 5.1, typography 5.2, spacing 5.3, radius 5.4, shadow 5.5) | Design.md §5 | 6 jam |
| 3 | Buat base components: Button (3 varian), Input, Card, Badge (Verified/Draft/In Lab/Rejected), Modal, Toast notification | Design.md §6 | 12 jam |
| 4 | Buat Navbar component (logo, menu, avatar, notifikasi, cart) — sticky on scroll, mobile hamburger | Design.md §6.1 | 6 jam |
| 5 | Buat Sidebar Dashboard component (240px desktop, collapsible 64px, grup menu) | Design.md §6.1 | 6 jam |
| 6 | Buat Landing Page: Hero section, "Masalah yang Kami Selesaikan" (2 kolom), "Cara Kerja" (4 langkah), Statistik counter, Trust pillars, Footer | Design.md §7.1 | 12 jam |
| 7 | Buat halaman Register: Role selector card (visual besar), multi-step form (Supplier/Buyer), password strength indicator | Design.md §7.2 | 8 jam |
| 8 | Buat halaman Login: form email + password, forgot password link, error inline | Design.md §7.2 | 4 jam |
| 9 | Implementasi auth state management (Zustand store untuk user session) | — | 4 jam |
| 10 | Responsive design untuk semua halaman Sprint 1 (desktop/tablet/mobile breakpoints) | Design.md §9 | 6 jam |

#### Backend Tasks

| # | Task | Referensi PRD | Estimasi |
|---|------|---------------|----------|
| 1 | Setup NestJS project dengan TypeScript, Prisma ORM, PostgreSQL connection | NFR Scalability | 4 jam |
| 2 | Setup Swagger/OpenAPI documentation | — | 2 jam |
| 3 | Implementasi Auth Module: register endpoint (Supplier/Buyer form berbeda) | FR-01 | 8 jam |
| 4 | Implementasi JWT strategy: access token (15 min) + refresh token (7 hari) | NFR Security | 6 jam |
| 5 | Implementasi RBAC Guard (Supplier, Buyer, Admin roles) | FR-01 | 4 jam |
| 6 | Implementasi login, logout, refresh token, forgot password, verify email endpoints | FR-01 | 8 jam |
| 7 | Setup Redis untuk session store dan rate limiting | NFR Performance | 3 jam |
| 8 | Implementasi email verification service (Nodemailer/SendGrid) | — | 4 jam |
| 9 | Setup file upload middleware (Multer) untuk dokumen legalitas koperasi | — | 3 jam |

#### Database Tasks

| # | Task | Tabel | Estimasi |
|---|------|-------|----------|
| 1 | Setup Prisma schema, initial migration | — | 2 jam |
| 2 | Buat tabel `users` (id, email, password_hash, role, status, created_at, updated_at) | users | 2 jam |
| 3 | Buat tabel `profiles` — relasi 1:1 dengan users. Field berbeda per role (Supplier: nama_koperasi, nomor_badan_hukum, NPWP, nama_ketua; Buyer: nama_bisnis, negara, contact_person) | profiles | 3 jam |
| 4 | Buat tabel `roles` dan `permissions` untuk RBAC | roles, permissions | 2 jam |
| 5 | Buat seeder untuk Admin account dan role data | — | 1 jam |

#### Testing

- Unit test: Auth service (register, login, JWT generation/validation)
- Unit test: RBAC guard (role authorization)
- Integration test: Register → verify email → login → access protected route
- Frontend: Component testing untuk base UI components

#### Deliverable

- ✅ Project repository tersetup dengan CI/CD pipeline (lint + test)
- ✅ Design system terimplementasi sebagai CSS variables + base components
- ✅ Landing page responsif dan fungsional
- ✅ Register multi-role dan login berfungsi end-to-end
- ✅ JWT authentication dan RBAC authorization aktif
- ✅ Database ter-seed dengan admin account
- ✅ API documentation Swagger tersedia

---

### Sprint 2: Marketplace Core (Minggu 3–4)

#### Goal
Membangun inti marketplace: katalog B2B storefront dengan filter parameter kimia, product card, product detail page, supplier dashboard, dan batch inventory management.

#### Features
- Buyer Marketplace page (katalog grid + filter sidebar + sort)
- Product Card component dengan PA% bar dan Verified Badge
- Product Detail page (parameter kimia chart, batch info, tab navigation)
- Supplier Dashboard (KPI cards, batch terbaru, pesanan terbaru, quick actions)
- Add Batch Product (wizard 3 langkah)
- Inventory List (tabel batch dengan filter status)

#### Frontend Tasks

| # | Task | Referensi Design.md | Estimasi |
|---|------|---------------------|----------|
| 1 | Buat Product Card component (Verified Badge, PA% progress bar, Batch ID monospace, harga/kg, hover effect) | Design.md §6.2 | 8 jam |
| 2 | Buat Chemical Parameter Card component (gauge/bar untuk satu parameter) | Design.md §6.2 | 4 jam |
| 3 | Buat Filter Component (sidebar sticky: PA% slider range, Moisture range, checkbox asal daerah, input volume min, tombol Terapkan/Reset) | Design.md §6.2 | 8 jam |
| 4 | Buat halaman Buyer Marketplace: header + filter sidebar (kiri) + sort bar (atas) + product card grid 3 kolom (kanan) + pagination | Design.md §7.3 | 12 jam |
| 5 | Buat halaman Product Detail: header (koperasi, batch ID, badge, asal), panel kiri (radar chart Recharts, tabel parameter), panel kanan (harga, volume, MOQ, CTA), tab navigation (Spesifikasi/CoA/Traceability/Info Supplier) | Design.md §7.4 | 16 jam |
| 6 | Buat Supplier Dashboard: 4 KPI cards (stok aktif, pesanan bulan ini, saldo wallet, batch pending), alert bar, mini tabel batch terbaru, mini tabel pesanan, quick actions | Design.md §7.8 | 12 jam |
| 7 | Buat Add Batch Wizard: Step 1 (asal & tanggal, upload foto), Step 2 (volume & harga), Step 3 (konfirmasi & submit), progress bar 3 langkah | Design.md §7.9 | 12 jam |
| 8 | Buat Inventory List page: tabel semua batch, kolom status (badge warna), filter status, bulk action | Design.md §3.1 | 8 jam |
| 9 | Buat Breadcrumb component | Design.md §6.1 | 2 jam |
| 10 | Responsive design marketplace (3 kolom → 2 kolom → 1 kolom, filter → collapsible/bottom sheet) | Design.md §9 | 6 jam |

#### Backend Tasks

| # | Task | Referensi PRD | Estimasi |
|---|------|---------------|----------|
| 1 | Buat Product Module: CRUD endpoint untuk batch produk | FR-02 | 8 jam |
| 2 | `POST /api/products/batches` — Supplier membuat batch baru (volume, asal lahan, tanggal produksi, harga target) | FR-02 | 4 jam |
| 3 | `GET /api/products` — Katalog marketplace dengan filter (PA% min/max, moisture, volume min, asal daerah, harga range), sort, pagination | FR-05, F-01 | 8 jam |
| 4 | `GET /api/products/:id` — Detail produk dengan parameter kimia, info supplier, batch info | F-01 | 4 jam |
| 5 | `GET /api/supplier/dashboard` — Aggregate data KPI (stok aktif, pesanan, saldo, pending batch) | F-02 | 4 jam |
| 6 | `GET /api/supplier/batches` — List semua batch milik supplier dengan filter status | F-02 | 4 jam |
| 7 | `PUT /api/supplier/batches/:id` — Update batch (sebelum status VERIFIED) | F-02 | 3 jam |
| 8 | Implementasi file upload untuk foto drum produk | — | 3 jam |
| 9 | Implementasi Redis caching untuk katalog marketplace | NFR Performance | 4 jam |

#### Database Tasks

| # | Task | Tabel | Estimasi |
|---|------|-------|----------|
| 1 | Buat tabel `products` (id, supplier_id, batch_code, status, origin_village, origin_district, production_date, created_at) | products | 3 jam |
| 2 | Buat tabel `batches` (id, product_id, total_volume_kg, available_volume_kg, moq_kg, price_per_kg, images[]) | batches | 3 jam |
| 3 | Buat tabel `product_parameters` (id, product_id, parameter_name, value, unit, standard_min, standard_max) — untuk PA%, Moisture, Specific Gravity, dll | product_parameters | 3 jam |
| 4 | Buat index untuk filter query (PA%, status, price, origin) | — | 2 jam |
| 5 | Buat seeder untuk 20+ mock product data dengan parameter kimia realistis | — | 3 jam |

#### Testing

- Unit test: Product service (CRUD, filter, pagination)
- Integration test: Supplier membuat batch → batch muncul di inventori dengan status DRAFT
- Integration test: Marketplace filter → return hasil yang sesuai
- Frontend: Component testing Product Card, Filter, Chart
- E2E: Supplier login → tambah batch → lihat di inventori

#### Deliverable

- ✅ Marketplace page fungsional dengan filter parameter kimia dan sorting
- ✅ Product Detail page dengan radar chart parameter kimia
- ✅ Supplier Dashboard dengan KPI cards dan quick actions
- ✅ Add Batch wizard 3 langkah berfungsi end-to-end
- ✅ Inventory List dengan filter status
- ✅ API katalog dioptimasi dengan Redis cache (load time < 2.5 detik)

---

### Sprint 3: Quality Assurance System (Minggu 5–6)

#### Goal
Membangun sistem penjaminan mutu: admin QC management, Digital CoA viewer, QR Code generation & traceability page, verification status tracker.

#### Features
- Admin Dashboard (KPI, antrian QC, validasi supplier)
- Admin QC Management (input hasil lab, generate CoA)
- Digital CoA Viewer (document-style, tabel parameter, tanda tangan digital)
- QR Code Generation & Download PDF
- QR Traceability Page (publik — timeline + peta)
- Verification Status Tracker (timeline stepper)
- Admin Supplier Validation

#### Frontend Tasks

| # | Task | Referensi Design.md | Estimasi |
|---|------|---------------------|----------|
| 1 | Buat Admin Dashboard: 4 KPI cards (pending validasi, pending QC, transaksi hari ini, revenue), antrian prioritas, antrian validasi, alert list, activity log | Design.md §7.10 | 12 jam |
| 2 | Buat Admin QC Management page: antrian batch review, form input parameter lab (PA%, Moisture, Specific Gravity, Refractive Index, Optical Rotation), tombol submit & generate CoA | Design.md §3.3 | 10 jam |
| 3 | Buat CoA Viewer component: layout dokumen resmi (header logo Valam + koperasi, nomor CoA, tanggal), tabel parameter (Nama/Nilai/Satuan/Standar/Status), tanda tangan digital, QR verifikasi, tombol Unduh PDF | Design.md §7.5 | 12 jam |
| 4 | Buat Laboratory Result Chart: radar chart (Recharts) 5-6 parameter vs standar industri | Design.md §6.3 | 6 jam |
| 5 | Buat Verification Status component: timeline stepper horizontal (Draft → Sampel Diterima → Pengujian Lab → CoA Diterbitkan → Aktif), ikon + label + timestamp | Design.md §6.3 | 6 jam |
| 6 | Buat QR Traceability Page (publik): header batch info, summary card, timeline perjalanan batch, Google Maps embed marker koordinat kebun, tombol "Lihat CoA" dan "Beli Produk Ini" | Design.md §7.6 | 12 jam |
| 7 | Buat Timeline History component (vertikal: Kebun → Hub → Lab → Etalase → Pengiriman) | Design.md §6.4 | 6 jam |
| 8 | Buat QR Scanner component: button "Scan QR" → buka kamera, fallback input manual Batch ID, redirect ke traceability | Design.md §6.4 | 6 jam |
| 9 | Buat Admin Validasi Supplier page: document viewer, checklist, approval/reject button | Design.md §3.3 | 6 jam |
| 10 | Buat Verified Badge variants: VERIFIED (hijau), IN REVIEW (amber), DRAFT (grey), REJECTED (merah) | Design.md §6.2 | 2 jam |

#### Backend Tasks

| # | Task | Referensi PRD | Estimasi |
|---|------|---------------|----------|
| 1 | Buat Quality Module: CRUD endpoint untuk QC results | FR-03, FR-04 | 6 jam |
| 2 | `POST /api/admin/qc/:batchId` — Admin input parameter lab (PA%, Moisture, Specific Gravity, Refractive Index, Optical Rotation, dsb) | FR-03 | 6 jam |
| 3 | `GET /api/products/:id/coa` — Ambil data CoA digital (parameter, metadata, tanda tangan) — requires Buyer login | F-03 | 4 jam |
| 4 | `GET /api/products/:id/coa/download` — Generate dan download CoA sebagai PDF | F-03 | 6 jam |
| 5 | Buat Traceability Module: `GET /api/trace/:batchId` — Data timeline perjalanan batch + koordinat GPS (publik, tanpa auth) | FR-04, F-04 | 6 jam |
| 6 | Implementasi QR Code generation service (generate QR mengandung URL traceability page) | FR-04 | 4 jam |
| 7 | `GET /api/trace/:batchId/qr` — Download QR Code sebagai PDF siap cetak | F-04 | 3 jam |
| 8 | `POST /api/admin/suppliers/:id/validate` — Admin approve/reject akun supplier | — | 4 jam |
| 9 | `GET /api/admin/dashboard` — Aggregate data admin (pending validasi, pending QC, transaksi, revenue) | — | 4 jam |
| 10 | `GET /api/admin/qc/queue` — Antrian batch pending QC (urut tanggal terlama) | — | 3 jam |
| 11 | Implementasi notification service (in-app notification saat status batch berubah) | — | 4 jam |

#### Database Tasks

| # | Task | Tabel | Estimasi |
|---|------|-------|----------|
| 1 | Buat tabel `qc_results` (id, product_id, admin_id, pa_percentage, moisture, specific_gravity, refractive_index, optical_rotation, status, tested_at, notes) | qc_results | 3 jam |
| 2 | Buat tabel `certificates` (id, product_id, qc_result_id, certificate_number, issued_at, admin_signature, pdf_url, qr_code_url) | certificates | 3 jam |
| 3 | Buat tabel `trace_logs` (id, product_id, event_type, location_name, location_district, gps_latitude, gps_longitude, description, event_date) | trace_logs | 3 jam |
| 4 | Buat tabel `notifications` (id, user_id, type, title, message, is_read, created_at) | notifications | 2 jam |
| 5 | Update status enum di tabel products: DRAFT → IN_LAB → VERIFIED → ACTIVE → REJECTED → SOLD_OUT | — | 1 jam |

#### Testing

- Unit test: QC service (input parameter, validate standar, generate CoA)
- Unit test: Traceability service (generate timeline, QR code)
- Integration test: Admin input QC → CoA generated → batch status VERIFIED → muncul di marketplace
- Integration test: Buyer scan QR → traceability page tampil data yang benar
- Frontend: Component testing CoA Viewer, Timeline, Radar Chart

#### Deliverable

- ✅ Admin dapat menginput hasil lab dan menerbitkan Digital CoA otomatis
- ✅ CoA Viewer menampilkan dokumen resmi dengan tanda tangan digital dan download PDF
- ✅ QR Code ter-generate otomatis setelah batch verified — dapat diunduh sebagai PDF siap cetak
- ✅ Halaman traceability publik menampilkan timeline perjalanan batch + peta koordinat kebun
- ✅ Verification status tracker berfungsi real-time di dashboard Supplier
- ✅ Admin dapat memvalidasi akun supplier baru

---

### Sprint 4: Transaction & Wallet (Minggu 7–8)

#### Goal
Membangun sistem transaksi B2B: cart, checkout grosir skala kilogram, order management, shipment tracking, supplier wallet, dan payment integration.

#### Features
- Cart component (ringkasan item, edit quantity, kalkulasi berat & ongkir)
- Checkout wizard (3 langkah: konfirmasi → alamat & kurir → pembayaran)
- Order Management (buyer: order history & tracking; supplier: pesanan masuk & konfirmasi)
- Shipment Tracker (nomor resi, progress bar, estimasi tiba)
- Supplier Wallet Dashboard (saldo, riwayat transaksi, form withdrawal)
- Payment Gateway integration (Midtrans)

#### Frontend Tasks

| # | Task | Referensi Design.md | Estimasi |
|---|------|---------------------|----------|
| 1 | Buat Cart component: daftar item (nama, volume kg, harga/kg, subtotal), edit quantity (validasi MOQ & max stok), kalkulasi total berat & estimasi ongkir | Design.md §6.5 | 8 jam |
| 2 | Buat Checkout page wizard: Step 1 (konfirmasi item & volume), Step 2 (alamat pengiriman + pilihan kurir kargo), Step 3 (ringkasan pembayaran + konfirmasi) | Design.md §6.5 | 12 jam |
| 3 | Buat Order History page (Buyer): daftar pesanan, badge status (Menunggu Konfirmasi/Dikemas/Dalam Pengiriman/Selesai), download invoice | Design.md §3.2 | 8 jam |
| 4 | Buat Shipment Tracker component: nomor resi, progress bar pengiriman, estimasi tiba, link tracking eksternal | Design.md §6.5 | 6 jam |
| 5 | Buat Pesanan Masuk page (Supplier): daftar pesanan, detail buyer, volume pesan, instruksi pengiriman, tombol konfirmasi & upload resi | Design.md §3.1 | 8 jam |
| 6 | Buat Wallet Dashboard (Supplier): balance card, riwayat transaksi (list), form withdrawal (nominal, rekening tujuan, submit) | Design.md §3.1 | 8 jam |
| 7 | Buat Order Status Badge component: warna sesuai design system (amber pending, blue proses, green selesai) | Design.md §6.5 | 2 jam |
| 8 | Responsive design untuk cart, checkout, order pages | Design.md §9 | 4 jam |

#### Backend Tasks

| # | Task | Referensi PRD | Estimasi |
|---|------|---------------|----------|
| 1 | Buat Transaction Module: CRUD endpoint untuk orders | FR-08 | 6 jam |
| 2 | `POST /api/cart` — Tambah item ke cart (validasi stok, MOQ) | F-05 | 4 jam |
| 3 | `GET /api/cart` — Ambil cart user dengan kalkulasi subtotal | F-05 | 3 jam |
| 4 | `PUT /api/cart/:itemId` — Update quantity (validasi stok) | F-05 | 2 jam |
| 5 | `DELETE /api/cart/:itemId` — Hapus item dari cart | F-05 | 1 jam |
| 6 | `POST /api/orders` — Checkout: buat order, kurangi stok, trigger pembayaran | FR-08 | 8 jam |
| 7 | `GET /api/orders` — List orders milik user (Buyer: history; Supplier: pesanan masuk) | FR-09 | 4 jam |
| 8 | `GET /api/orders/:id` — Detail order | FR-09 | 3 jam |
| 9 | `PUT /api/orders/:id/confirm` — Supplier konfirmasi pesanan | — | 3 jam |
| 10 | `PUT /api/orders/:id/shipment` — Supplier upload nomor resi | FR-09 | 3 jam |
| 11 | `GET /api/orders/:id/tracking` — Status pengiriman (integrasi API kurir) | FR-09, F-08 | 6 jam |
| 12 | Buat Wallet Module: `GET /api/wallet` — Saldo dan riwayat transaksi | FR-10, F-09 | 4 jam |
| 13 | `POST /api/wallet/withdraw` — Pengajuan pencairan dana | FR-10 | 4 jam |
| 14 | Integrasi Payment Gateway (Midtrans Snap) — create transaction, handle callback | F-05 | 8 jam |
| 15 | Implementasi shipping cost calculation service | F-05 | 4 jam |

#### Database Tasks

| # | Task | Tabel | Estimasi |
|---|------|-------|----------|
| 1 | Buat tabel `orders` (id, buyer_id, supplier_id, status, total_amount, shipping_cost, shipping_address, payment_status, created_at) | orders | 3 jam |
| 2 | Buat tabel `order_items` (id, order_id, product_id, quantity_kg, price_per_kg, subtotal) | order_items | 2 jam |
| 3 | Buat tabel `payments` (id, order_id, payment_method, payment_gateway_id, amount, status, paid_at) | payments | 2 jam |
| 4 | Buat tabel `shipments` (id, order_id, courier, tracking_number, status, estimated_arrival, shipped_at, delivered_at) | shipments | 2 jam |
| 5 | Buat tabel `wallets` (id, user_id, balance, updated_at) | wallets | 2 jam |
| 6 | Buat tabel `wallet_transactions` (id, wallet_id, type [credit/debit], amount, reference_order_id, description, created_at) | wallet_transactions | 2 jam |
| 7 | Buat tabel `withdrawals` (id, wallet_id, amount, bank_name, account_number, account_holder, status, requested_at, processed_at) | withdrawals | 2 jam |
| 8 | Buat tabel `cart_items` (id, user_id, product_id, quantity_kg, created_at) | cart_items | 1 jam |

#### Testing

- Unit test: Order service (create, update status, kalkulasi total)
- Unit test: Wallet service (credit, debit, withdrawal)
- Integration test: Buyer checkout → order created → payment processed → Supplier notified
- Integration test: Supplier konfirmasi → upload resi → status berubah → Buyer melihat tracking
- Integration test: Order completed → dana masuk wallet → withdrawal
- Frontend: Component testing Cart, Checkout wizard, Shipment tracker

#### Deliverable

- ✅ Buyer dapat menambahkan produk ke cart dan checkout dengan pembayaran digital
- ✅ Order management berfungsi untuk Buyer (history) dan Supplier (pesanan masuk)
- ✅ Supplier dapat mengonfirmasi pesanan dan upload nomor resi pengiriman
- ✅ Shipment tracker menampilkan status pengiriman real-time
- ✅ Supplier Wallet menampilkan saldo dan mendukung pengajuan withdrawal
- ✅ Payment gateway (Midtrans) terintegrasi untuk pembayaran domestik

---

### Sprint 5: Smart Matching & RFQ (Minggu 9–10)

#### Goal
Membangun fitur Smart Matching berbasis algoritma Rule-Based MCDM dan modul RFQ Submission untuk menunjukkan kesiapan platform menangani flow procurement B2B profesional.

#### Features
- Smart Matching page (form kriteria industri + tabel rekomendasi skor)
- Algoritma Rule-Based MCDM (Euclidean Distance scoring)
- RFQ Submission form
- RFQ Management (Supplier: respond to RFQ; Admin: monitoring)

#### Frontend Tasks

| # | Task | Referensi Design.md | Estimasi |
|---|------|---------------------|----------|
| 1 | Buat Smart Matching page: judul, form input kriteria (volume kg, budget maks/kg, min PA%, max Moisture) dengan slider, tombol "Temukan Rekomendasi" | Design.md §7.7 | 8 jam |
| 2 | Buat Recommendation Table: 5 baris terurut (Batch ID, Koperasi, PA%, Moisture, Harga, Match Score %, tombol Lihat Detail), match score badge warna gradient | Design.md §7.7 | 8 jam |
| 3 | Buat loading state dan empty state untuk Smart Matching ("Belum ada batch yang cocok saat ini") | Design.md §11 | 3 jam |
| 4 | Buat RFQ Submission form: field volume, budget, spesifikasi, catatan, pilih supplier target, tombol submit | Design.md §4 (IA) | 6 jam |
| 5 | Buat RFQ list page (Buyer: RFQ terkirim & status; Supplier: RFQ masuk) | — | 6 jam |
| 6 | Responsive design untuk Smart Matching dan RFQ pages | Design.md §9 | 4 jam |

#### Backend Tasks

| # | Task | Referensi PRD | Estimasi |
|---|------|---------------|----------|
| 1 | Buat Matching Module dengan algoritma MCDM | F-06, FR-06 | 10 jam |
| 2 | `POST /api/matching` — Terima kriteria (volume, budget, min PA%, max Moisture), filter stok aktif, hitung Euclidean Distance score, return top 5 | F-06 | 8 jam |
| 3 | Optimasi query matching: indexing, pre-filter status=ACTIVE, response time < 500ms | NFR Performance | 4 jam |
| 4 | Buat RFQ Module: CRUD endpoint | FR-07, F-07 | 6 jam |
| 5 | `POST /api/rfq` — Buyer submit RFQ ke supplier tertentu | FR-07 | 4 jam |
| 6 | `GET /api/rfq` — List RFQ (Buyer: sent; Supplier: received) | FR-07 | 3 jam |
| 7 | `PUT /api/rfq/:id/respond` — Supplier merespon RFQ (accept/reject/counter-offer) | FR-07 | 4 jam |
| 8 | Implementasi notifikasi RFQ ke supplier (in-app + email) | — | 3 jam |

#### Database Tasks

| # | Task | Tabel | Estimasi |
|---|------|-------|----------|
| 1 | Buat tabel `rfq_requests` (id, buyer_id, supplier_id, volume_kg, budget_per_kg, min_pa, max_moisture, notes, status, created_at) | rfq_requests | 2 jam |
| 2 | Buat tabel `rfq_responses` (id, rfq_id, supplier_id, proposed_price, proposed_volume, message, status, responded_at) | rfq_responses | 2 jam |
| 3 | Index untuk matching query optimization (compound index: status + PA + moisture + price) | — | 2 jam |

#### Testing

- Unit test: MCDM algorithm (Euclidean Distance scoring correctness)
- Unit test: Matching service (filter, sort, top 5 selection)
- Performance test: Matching response < 500ms dengan 1000+ produk
- Integration test: Buyer input kriteria → mendapat 5 rekomendasi terurut → klik detail → navigasi ke product detail
- Integration test: Buyer submit RFQ → Supplier menerima notifikasi → respond → Buyer melihat response
- Frontend: Component testing form kriteria, recommendation table

#### Deliverable

- ✅ Smart Matching page berfungsi: input kriteria → rekomendasi 5 batch terbaik dengan Match Score
- ✅ Algoritma MCDM (Euclidean Distance) menghasilkan skor akurat dalam < 500ms
- ✅ RFQ Submission berfungsi end-to-end: Buyer submit → Supplier respond
- ✅ Notifikasi RFQ aktif (in-app + email)

---

### Sprint 6: Testing, Polish & Deployment (Minggu 11–12)

#### Goal
Integrasi end-to-end seluruh fitur, testing komprehensif, performance optimization, security hardening, dan deployment ke production.

#### Features
- Integration testing seluruh module
- User Acceptance Testing (seluruh role)
- Performance optimization (lighthouse, caching, lazy loading)
- Security audit (OWASP checklist)
- Production deployment & monitoring setup

#### Frontend Tasks

| # | Task | Estimasi |
|---|------|----------|
| 1 | Fix semua responsive breakpoint issues yang ditemukan selama testing | 8 jam |
| 2 | Implementasi semua empty states sesuai UX Writing (Design.md §11) | 4 jam |
| 3 | Implementasi semua error messages sesuai Design.md §11 | 4 jam |
| 4 | Implementasi semua success messages (toast notifications) | 3 jam |
| 5 | Performance optimization: image optimization, lazy loading, code splitting | 8 jam |
| 6 | Accessibility audit: kontras warna, keyboard navigation, screen reader, focus states | 6 jam |
| 7 | SEO optimization: meta tags, Open Graph, sitemap | 4 jam |
| 8 | Cross-browser testing (Chrome, Firefox, Safari, Edge) | 4 jam |
| 9 | Mobile testing pada perangkat fisik | 4 jam |

#### Backend Tasks

| # | Task | Estimasi |
|---|------|----------|
| 1 | End-to-end integration testing seluruh API endpoints | 8 jam |
| 2 | Security hardening: input validation (semua endpoint), SQL injection prevention, XSS prevention | 6 jam |
| 3 | Rate limiting implementation (API endpoint protection) | 3 jam |
| 4 | Error handling standardization (consistent error response format) | 4 jam |
| 5 | API documentation final review (Swagger completeness) | 3 jam |
| 6 | Database backup strategy implementation | 3 jam |
| 7 | Logging & monitoring setup (Sentry integration) | 4 jam |
| 8 | Production environment configuration (env variables, secrets) | 3 jam |

#### Deployment Tasks

| # | Task | Estimasi |
|---|------|----------|
| 1 | Setup staging environment (identical ke production) | 4 jam |
| 2 | CI/CD pipeline finalization (GitHub Actions: test → build → deploy) | 4 jam |
| 3 | Frontend deployment ke Vercel (production) | 2 jam |
| 4 | Backend deployment ke Railway/Render (production) | 3 jam |
| 5 | Database migration ke production PostgreSQL | 2 jam |
| 6 | SSL/TLS certificate verification | 1 jam |
| 7 | Domain & DNS configuration | 2 jam |
| 8 | Monitoring dashboard setup (Sentry + Vercel Analytics) | 3 jam |
| 9 | Smoke testing di production | 2 jam |

#### Testing

- **Full regression testing** seluruh fitur
- **Performance testing**: Lighthouse score ≥ 90, katalog load < 2.5 detik, Smart Matching < 500ms
- **Security testing**: OWASP Top 10 checklist
- **UAT**: Skenario lengkap per role (lihat bagian 11: Testing Strategy)

#### Deliverable

- ✅ Seluruh fitur MVP terintegrasi dan berfungsi end-to-end
- ✅ Performance memenuhi NFR (katalog < 2.5 detik, matching < 500ms)
- ✅ Security audit passed (JWT, RBAC, HTTPS, input validation)
- ✅ UAT passed untuk semua role (Supplier, Buyer, Admin)
- ✅ Platform deployed ke production dengan monitoring aktif
- ✅ API documentation lengkap dan up-to-date
- ✅ Backup strategy aktif

---

## 7. Database Development Plan

### 7.1 Entity Relationship Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│    users     │────→│   profiles   │     │      roles      │
│             │     │             │     │                 │
│  id (PK)    │     │  user_id(FK)│     │  id (PK)       │
│  email      │     │  nama       │     │  name          │
│  password   │     │  koperasi   │     │  permissions[] │
│  role_id(FK)│←────│  npwp       │     │                │
│  status     │     │  badan_hukum│     └─────────────────┘
│  verified   │     │  negara     │
└──────┬──────┘     └─────────────┘
       │
       │ 1:N
       ▼
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  products   │────→│product_parameters│     │   qc_results    │
│             │     │                 │     │                 │
│  id (PK)    │     │  product_id(FK) │     │  product_id(FK) │
│  supplier_id│     │  parameter_name │     │  admin_id (FK)  │
│  batch_code │     │  value          │     │  pa_percentage  │
│  status     │     │  unit           │     │  moisture       │
│  origin     │     │  standard_min   │     │  specific_grav  │
│  price/kg   │     │  standard_max   │     │  refractive_idx │
│  volume     │     └─────────────────┘     │  optical_rot    │
│  moq        │                             │  status         │
└──────┬──────┘                             │  tested_at      │
       │                                    └────────┬────────┘
       │ 1:1                                         │
       ▼                                             ▼
┌─────────────────┐                      ┌─────────────────┐
│  certificates   │                      │   trace_logs    │
│                 │                      │                 │
│  product_id(FK) │                      │  product_id(FK) │
│  qc_result_id   │                      │  event_type     │
│  cert_number    │                      │  location_name  │
│  issued_at      │                      │  gps_lat        │
│  admin_signature│                      │  gps_lng        │
│  pdf_url        │                      │  event_date     │
│  qr_code_url    │                      │  description    │
└─────────────────┘                      └─────────────────┘

┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   orders    │────→│ order_items  │     │   payments      │
│             │     │              │     │                 │
│  id (PK)    │     │  order_id(FK)│     │  order_id (FK)  │
│  buyer_id   │     │  product_id  │     │  method         │
│  supplier_id│     │  quantity_kg │     │  gateway_id     │
│  status     │     │  price_per_kg│     │  amount         │
│  total      │     │  subtotal    │     │  status         │
│  shipping   │     └──────────────┘     │  paid_at        │
│  address    │                          └─────────────────┘
└──────┬──────┘
       │ 1:1
       ▼
┌─────────────────┐
│   shipments     │
│                 │
│  order_id (FK)  │
│  courier        │
│  tracking_no    │
│  status         │
│  est_arrival    │
│  shipped_at     │
│  delivered_at   │
└─────────────────┘

┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   wallets   │────→│wallet_transactions│     │  withdrawals   │
│             │     │                  │     │                 │
│  id (PK)    │     │  wallet_id (FK)  │     │  wallet_id(FK)  │
│  user_id(FK)│     │  type            │     │  amount         │
│  balance    │     │  amount          │     │  bank_name      │
│  updated_at │     │  ref_order_id    │     │  account_no     │
└─────────────┘     │  description     │     │  status         │
                    │  created_at      │     │  requested_at   │
                    └──────────────────┘     │  processed_at   │
                                            └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│  rfq_requests   │────→│  rfq_responses  │
│                 │     │                 │
│  id (PK)        │     │  rfq_id (FK)    │
│  buyer_id (FK)  │     │  supplier_id(FK)│
│  supplier_id(FK)│     │  proposed_price │
│  volume_kg      │     │  proposed_vol   │
│  budget_per_kg  │     │  message        │
│  min_pa         │     │  status         │
│  max_moisture   │     │  responded_at   │
│  notes          │     └─────────────────┘
│  status         │
│  created_at     │
└─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│  notifications  │     │   cart_items     │
│                 │     │                 │
│  id (PK)        │     │  id (PK)        │
│  user_id (FK)   │     │  user_id (FK)   │
│  type           │     │  product_id(FK) │
│  title          │     │  quantity_kg    │
│  message        │     │  created_at     │
│  is_read        │     └─────────────────┘
│  created_at     │
└─────────────────┘
```

### 7.2 Database Modules

#### Module 1: User Management

**Tables:** `users`, `roles`, `profiles`

| Tabel | Kolom Utama | Relasi |
|-------|-------------|--------|
| `users` | id, email, password_hash, role_id, status (pending/active/suspended), email_verified, created_at, updated_at | belongs_to `roles`, has_one `profiles` |
| `roles` | id, name (supplier/buyer/admin), permissions (JSON), created_at | has_many `users` |
| `profiles` | id, user_id, company_name, legal_number, npwp, chairman_name, country, contact_person, phone, address, avatar_url | belongs_to `users` |

**Catatan:** Field `profiles` bersifat polimorfik — Supplier mengisi kolom koperasi/badan_hukum, Buyer mengisi bisnis/negara. Kolom nullable digunakan untuk fleksibilitas tanpa perlu tabel terpisah.

#### Module 2: Product Management

**Tables:** `products`, `product_parameters`

| Tabel | Kolom Utama | Relasi |
|-------|-------------|--------|
| `products` | id, supplier_id, batch_code (unique, format VLM-YYYY-NNNN), status (DRAFT/IN_LAB/VERIFIED/ACTIVE/REJECTED/SOLD_OUT), origin_village, origin_district, origin_province, production_date, total_volume_kg, available_volume_kg, moq_kg, price_per_kg, images[], created_at, updated_at | belongs_to `users` (Supplier), has_many `product_parameters`, has_one `qc_results`, has_one `certificates`, has_many `trace_logs` |
| `product_parameters` | id, product_id, parameter_name, value, unit, standard_min, standard_max, status (pass/fail) | belongs_to `products` |

**Catatan:** `batch_code` di-generate otomatis oleh sistem. `product_parameters` diisi oleh Admin setelah QC — bukan oleh Supplier.

#### Module 3: Quality Management

**Tables:** `qc_results`, `certificates`

| Tabel | Kolom Utama | Relasi |
|-------|-------------|--------|
| `qc_results` | id, product_id, admin_id, pa_percentage, moisture, specific_gravity, refractive_index, optical_rotation, overall_status (pass/fail), tested_at, lab_notes | belongs_to `products`, belongs_to `users` (Admin), has_one `certificates` |
| `certificates` | id, product_id, qc_result_id, certificate_number (unique), issued_at, admin_name, admin_signature_url, pdf_url, qr_code_url | belongs_to `products`, belongs_to `qc_results` |

**Catatan:** Ketika Admin menginput QC dan hasilnya pass, sistem otomatis: (1) Membuat entry `certificates`, (2) Generate PDF CoA, (3) Generate QR Code, (4) Update status produk ke VERIFIED.

#### Module 4: Traceability

**Tables:** `trace_logs`

| Tabel | Kolom Utama | Relasi |
|-------|-------------|--------|
| `trace_logs` | id, product_id, event_type (HARVEST/HUB_RECEIVED/LAB_TESTED/COA_ISSUED/MARKETPLACE_ACTIVE/SHIPPED/DELIVERED), location_name, location_district, gps_latitude, gps_longitude, description, event_date, created_at | belongs_to `products` |

**Catatan:** `trace_logs` di-populate otomatis oleh sistem pada setiap event lifecycle batch. Entry pertama (HARVEST) menggunakan data asal lahan dari Supplier saat mendaftarkan batch.

#### Module 5: Transaction

**Tables:** `orders`, `order_items`, `payments`, `shipments`, `cart_items`

| Tabel | Kolom Utama | Relasi |
|-------|-------------|--------|
| `orders` | id, order_number (unique), buyer_id, supplier_id, status (PENDING/CONFIRMED/SHIPPED/DELIVERED/COMPLETED/CANCELLED), total_amount, shipping_cost, shipping_address (JSON), payment_status, created_at | belongs_to `users` (Buyer & Supplier), has_many `order_items`, has_one `payments`, has_one `shipments` |
| `order_items` | id, order_id, product_id, quantity_kg, price_per_kg, subtotal | belongs_to `orders`, belongs_to `products` |
| `payments` | id, order_id, payment_method, payment_gateway_id, amount, status (pending/success/failed/expired), paid_at | belongs_to `orders` |
| `shipments` | id, order_id, courier_name, tracking_number, status, estimated_arrival, shipped_at, delivered_at | belongs_to `orders` |
| `cart_items` | id, user_id, product_id, quantity_kg, created_at | belongs_to `users`, belongs_to `products` |

#### Module 6: Wallet & Financial

**Tables:** `wallets`, `wallet_transactions`, `withdrawals`

| Tabel | Kolom Utama | Relasi |
|-------|-------------|--------|
| `wallets` | id, user_id, balance (Decimal), updated_at | belongs_to `users` (Supplier) |
| `wallet_transactions` | id, wallet_id, type (CREDIT/DEBIT), amount, reference_order_id, description, created_at | belongs_to `wallets` |
| `withdrawals` | id, wallet_id, amount, bank_name, account_number, account_holder_name, status (PENDING/PROCESSING/COMPLETED/REJECTED), requested_at, processed_at | belongs_to `wallets` |

#### Module 7: RFQ

**Tables:** `rfq_requests`, `rfq_responses`

| Tabel | Kolom Utama | Relasi |
|-------|-------------|--------|
| `rfq_requests` | id, rfq_number (unique), buyer_id, supplier_id, volume_kg, budget_per_kg, min_pa_percentage, max_moisture, notes, status (SENT/RESPONDED/ACCEPTED/REJECTED/EXPIRED), created_at | belongs_to `users` (Buyer & Supplier), has_one `rfq_responses` |
| `rfq_responses` | id, rfq_id, supplier_id, proposed_price_per_kg, proposed_volume_kg, message, status (ACCEPTED/REJECTED/COUNTER_OFFER), responded_at | belongs_to `rfq_requests` |

#### Module 8: Notification

**Tables:** `notifications`

| Tabel | Kolom Utama | Relasi |
|-------|-------------|--------|
| `notifications` | id, user_id, type (BATCH_STATUS/ORDER_NEW/ORDER_STATUS/RFQ_NEW/RFQ_RESPONSE/WALLET_CREDIT/SYSTEM), title, message, is_read, action_url, created_at | belongs_to `users` |

---

## 8. Backend API Planning

### 8.1 Authentication Module

| Method | Endpoint | Purpose | Role | Request Body | Response |
|--------|----------|---------|------|-------------|----------|
| `POST` | `/api/auth/register` | Registrasi akun baru | Guest | `{ email, password, role, profile: { company_name, legal_number, ... } }` | `{ user, accessToken, refreshToken }` |
| `POST` | `/api/auth/login` | Login ke platform | Guest | `{ email, password }` | `{ user, accessToken, refreshToken }` |
| `POST` | `/api/auth/refresh` | Refresh access token | All | Cookie: refreshToken | `{ accessToken }` |
| `POST` | `/api/auth/logout` | Logout dan invalidate token | All | — | `{ message: "Logged out" }` |
| `POST` | `/api/auth/forgot-password` | Kirim link reset password | Guest | `{ email }` | `{ message: "Email sent" }` |
| `POST` | `/api/auth/reset-password` | Reset password dengan token | Guest | `{ token, newPassword }` | `{ message: "Password updated" }` |
| `POST` | `/api/auth/verify-email` | Verifikasi email | Guest | `{ token }` | `{ message: "Email verified" }` |
| `GET` | `/api/auth/me` | Ambil data user yang login | All | — | `{ user, profile }` |

### 8.2 Product Module

| Method | Endpoint | Purpose | Role | Request Body / Params | Response |
|--------|----------|---------|------|----------------------|----------|
| `GET` | `/api/products` | Katalog marketplace dengan filter | Buyer | Query: `?pa_min=28&pa_max=40&moisture_max=2&origin=aceh&price_min=200000&price_max=400000&sort=pa_desc&page=1&limit=12` | `{ products[], total, page, totalPages }` |
| `GET` | `/api/products/:id` | Detail produk lengkap | Buyer | Path: productId | `{ product, parameters[], supplier, certificate, traceability }` |
| `POST` | `/api/products/batches` | Supplier membuat batch baru | Supplier | `{ origin_village, origin_district, origin_province, production_date, total_volume_kg, moq_kg, price_per_kg, images[] }` | `{ product (status: DRAFT) }` |
| `GET` | `/api/supplier/batches` | List semua batch milik supplier | Supplier | Query: `?status=ACTIVE&page=1` | `{ batches[], total }` |
| `GET` | `/api/supplier/batches/:id` | Detail batch supplier | Supplier | Path: batchId | `{ batch, parameters, qcResult, certificate }` |
| `PUT` | `/api/supplier/batches/:id` | Update batch (sebelum VERIFIED) | Supplier | `{ price_per_kg, total_volume_kg, ... }` | `{ batch (updated) }` |
| `GET` | `/api/supplier/dashboard` | Dashboard KPI supplier | Supplier | — | `{ activeStock, monthlyOrders, walletBalance, pendingBatches, recentBatches[], recentOrders[] }` |

### 8.3 Quality Module

| Method | Endpoint | Purpose | Role | Request Body / Params | Response |
|--------|----------|---------|------|----------------------|----------|
| `POST` | `/api/admin/qc/:batchId` | Admin input hasil lab | Admin | `{ pa_percentage, moisture, specific_gravity, refractive_index, optical_rotation, lab_notes }` | `{ qcResult, certificate (auto-generated), product (status: VERIFIED) }` |
| `GET` | `/api/admin/qc/queue` | Antrian batch pending QC | Admin | Query: `?sort=oldest_first&page=1` | `{ queue[], total }` |
| `GET` | `/api/products/:id/coa` | Ambil data Digital CoA | Buyer | Path: productId | `{ certificate, parameters[], qcResult, supplier }` |
| `GET` | `/api/products/:id/coa/download` | Download CoA sebagai PDF | Buyer | Path: productId | Binary PDF file |
| `PUT` | `/api/admin/qc/:batchId/reject` | Admin reject batch QC | Admin | `{ reason }` | `{ product (status: REJECTED), notification }` |
| `POST` | `/api/admin/products/:id/approve` | Admin approve listing ke marketplace | Admin | — | `{ product (status: ACTIVE) }` |

### 8.4 Traceability Module

| Method | Endpoint | Purpose | Role | Request Body / Params | Response |
|--------|----------|---------|------|----------------------|----------|
| `GET` | `/api/trace/:batchId` | Data traceability publik | Public | Path: batchId | `{ batch_summary, timeline[], gps_coordinates, certificate_info }` |
| `GET` | `/api/trace/:batchId/qr` | Download QR Code PDF | Supplier | Path: batchId | Binary PDF file (QR siap cetak) |

### 8.5 Transaction Module

| Method | Endpoint | Purpose | Role | Request Body / Params | Response |
|--------|----------|---------|------|----------------------|----------|
| `GET` | `/api/cart` | Ambil cart user | Buyer | — | `{ items[], subtotal, estimatedShipping, total }` |
| `POST` | `/api/cart` | Tambah item ke cart | Buyer | `{ product_id, quantity_kg }` | `{ cartItem }` |
| `PUT` | `/api/cart/:itemId` | Update quantity | Buyer | `{ quantity_kg }` | `{ cartItem (updated) }` |
| `DELETE` | `/api/cart/:itemId` | Hapus item dari cart | Buyer | — | `{ message: "Removed" }` |
| `POST` | `/api/orders` | Checkout / buat order | Buyer | `{ shipping_address, courier, payment_method }` | `{ order, payment_url (Midtrans Snap) }` |
| `GET` | `/api/orders` | List orders | Buyer, Supplier | Query: `?status=SHIPPED&page=1` | `{ orders[], total }` |
| `GET` | `/api/orders/:id` | Detail order | Buyer, Supplier | Path: orderId | `{ order, items[], payment, shipment }` |
| `PUT` | `/api/orders/:id/confirm` | Supplier konfirmasi pesanan | Supplier | — | `{ order (status: CONFIRMED) }` |
| `PUT` | `/api/orders/:id/shipment` | Supplier upload resi | Supplier | `{ courier_name, tracking_number }` | `{ shipment }` |
| `GET` | `/api/orders/:id/tracking` | Status pengiriman real-time | Buyer, Supplier | Path: orderId | `{ shipment, tracking_events[] }` |
| `POST` | `/api/orders/:id/complete` | Buyer konfirmasi terima barang | Buyer | — | `{ order (status: COMPLETED), wallet_credit }` |

### 8.6 Wallet Module

| Method | Endpoint | Purpose | Role | Request Body / Params | Response |
|--------|----------|---------|------|----------------------|----------|
| `GET` | `/api/wallet` | Saldo dan riwayat transaksi | Supplier | Query: `?page=1` | `{ balance, transactions[] }` |
| `POST` | `/api/wallet/withdraw` | Pengajuan withdrawal | Supplier | `{ amount, bank_name, account_number, account_holder_name }` | `{ withdrawal (status: PENDING) }` |
| `GET` | `/api/wallet/withdrawals` | Riwayat withdrawal | Supplier | Query: `?page=1` | `{ withdrawals[] }` |

### 8.7 Smart Matching Module

| Method | Endpoint | Purpose | Role | Request Body / Params | Response |
|--------|----------|---------|------|----------------------|----------|
| `POST` | `/api/matching` | Cari rekomendasi batch terbaik | Buyer | `{ volume_kg, budget_per_kg, min_pa_percentage, max_moisture }` | `{ recommendations[5]: { batch, supplier, score_percentage } }` |

### 8.8 RFQ Module

| Method | Endpoint | Purpose | Role | Request Body / Params | Response |
|--------|----------|---------|------|----------------------|----------|
| `POST` | `/api/rfq` | Submit RFQ ke supplier | Buyer | `{ supplier_id, volume_kg, budget_per_kg, min_pa, max_moisture, notes }` | `{ rfq (status: SENT) }` |
| `GET` | `/api/rfq` | List RFQ | Buyer, Supplier | Query: `?role=buyer&page=1` | `{ rfqs[] }` |
| `GET` | `/api/rfq/:id` | Detail RFQ | Buyer, Supplier | Path: rfqId | `{ rfq, response }` |
| `PUT` | `/api/rfq/:id/respond` | Supplier merespon RFQ | Supplier | `{ proposed_price_per_kg, proposed_volume_kg, message, status }` | `{ rfqResponse }` |

### 8.9 Admin Module

| Method | Endpoint | Purpose | Role | Request Body / Params | Response |
|--------|----------|---------|------|----------------------|----------|
| `GET` | `/api/admin/dashboard` | Dashboard KPI admin | Admin | — | `{ pendingSuppliers, pendingQC, todayTransactions, revenue, priorityQueue[], recentActivity[] }` |
| `GET` | `/api/admin/suppliers/pending` | List supplier menunggu validasi | Admin | — | `{ suppliers[] }` |
| `POST` | `/api/admin/suppliers/:id/validate` | Approve/reject supplier | Admin | `{ action: "approve" / "reject", reason }` | `{ user (status: active/rejected) }` |
| `GET` | `/api/admin/transactions` | Monitoring semua transaksi | Admin | Query: `?status=DISPUTED&page=1` | `{ transactions[] }` |
| `GET` | `/api/admin/transactions/export` | Export transaksi CSV | Admin | Query: `?date_from&date_to` | CSV file |

### 8.10 Notification Module

| Method | Endpoint | Purpose | Role | Request Body / Params | Response |
|--------|----------|---------|------|----------------------|----------|
| `GET` | `/api/notifications` | List notifikasi user | All | Query: `?unread_only=true` | `{ notifications[], unread_count }` |
| `PUT` | `/api/notifications/:id/read` | Tandai notifikasi sudah dibaca | All | — | `{ notification (is_read: true) }` |
| `PUT` | `/api/notifications/read-all` | Tandai semua sudah dibaca | All | — | `{ message: "All marked as read" }` |

---

## 9. Frontend Implementation Plan

### 9.1 Mapping Design.md → Development Tasks

| Design Page (Design.md §) | Components yang Dibutuhkan | Developer Task |
|---------------------------|---------------------------|----------------|
| **Landing Page** (§7.1) | Hero Section, Step Cards (4), Stat Counter Cards, Trust Pillar Cards, Dual CTA Buttons, Footer | Implement responsive landing page. Connect stat counters ke API platform stats. Animasi fade-in scroll. |
| **Login / Register** (§7.2) | Role Selector Card (2, visual besar), Multi-step Form, Password Strength Indicator, Error Inline | Implement conditional form rendering berdasarkan role. Client-side validation (Zod). Connect ke auth API. Handle redirect post-login berdasarkan role. |
| **Buyer Marketplace** (§7.3) | Filter Sidebar (sticky), Sort Dropdown, Product Card Grid (3 kolom), Verified Badge, PA% Bar, Pagination | Implement server-side filtering & sorting. Infinite scroll atau pagination. Loading skeleton. Responsive: 3→2→1 kolom. Mobile: filter → bottom sheet. |
| **Product Detail** (§7.4) | Radar Chart (Recharts), Parameter Table, Batch Badge, CTA Buttons (Add to Cart + RFQ), Tab Navigation (4 tab) | Implement tab content loading (lazy). Radar chart dengan referensi standar industri. Connect CTA ke cart/RFQ API. |
| **Digital CoA** (§7.5) | CoA Viewer (document-style), Parameter Table (5+ kolom), Verified Signature Block, Download Button, QR Verification | Implement document layout. Generate PDF client-side (jsPDF) atau fetch dari server. Protected route (require login). |
| **QR Traceability** (§7.6) | Timeline History (vertikal), Google Maps Embed, Summary Card, CTA Buttons | Implement public page (no auth). Google Maps API key. Responsive: timeline atas, peta bawah (mobile). Share button. |
| **Smart Matching** (§7.7) | Input Form (slider + number), Submit Button, Recommendation Table, Match Score Badge | Implement form dengan React Hook Form. Loading state saat kalkulasi. Empty state. Link ke Product Detail. |
| **Supplier Dashboard** (§7.8) | KPI Cards (4), Alert Bar, Mini Tables (batch + pesanan), Quick Action Buttons | Implement real-time data refresh. Skeleton loading. Connect ke dashboard API. Quick action routing. |
| **Add Batch Wizard** (§7.9) | Step Progress Bar (3), Form Fields, Image Upload (drag & drop), Summary Card, Submit Button | Implement multi-step form state (React Hook Form). Validasi per step. Image preview. Confirm modal. |
| **Admin Dashboard** (§7.10) | KPI Cards (4), Priority Queue Tables, Alert List, Activity Log, Sidebar Navigation Admin | Implement sortable tables. Badge status berwarna. Click-through ke detail page. Polling / refresh data. |
| **Admin QC Management** (§3.3) | Form Input Parameter (6+ field numerik), Submit & Generate CoA Button, Batch Preview | Implement numeric validation. Real-time preview CoA layout. Confirmation modal sebelum submit. |
| **Admin Validasi Supplier** (§3.3) | Document Viewer (preview upload legalitas), Checklist, Approve/Reject Buttons | Implement file preview (PDF/image). Checklist state. Reject reason modal. |
| **Cart & Checkout** (§6.5) | Cart Item List, Quantity Editor, Shipping Calculator, Checkout Wizard (3 step), Order Summary | Implement cart state (Zustand). Volume validation (MOQ, max stok). Ongkir calculation. Midtrans Snap integration. |
| **Order History** (§3.2) | Order List, Order Status Badge, Shipment Tracker, Download Invoice Button | Implement role-based view (Buyer: history; Supplier: pesanan masuk). Status filtering. Invoice PDF download. |
| **Wallet** (§3.1) | Balance Card, Transaction List, Withdrawal Form, Withdrawal History | Implement balance display. Transaction pagination. Form validation (min/max withdrawal). |
| **RFQ Submission** (§4 IA) | RFQ Form, RFQ List, RFQ Detail, Response View | Implement form submission. Status tracking. Notification integration. |

---

## 10. Component Development Strategy

### 10.1 Folder Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── (public)/                 # Public routes (no auth)
│   │   ├── page.tsx              # Landing Page
│   │   └── trace/[batchId]/      # QR Traceability Page (publik)
│   │       └── page.tsx
│   ├── (auth)/                   # Auth routes
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (buyer)/                  # Buyer protected routes
│   │   ├── marketplace/page.tsx
│   │   ├── products/[id]/page.tsx    # Product Detail
│   │   ├── products/[id]/coa/page.tsx # Digital CoA
│   │   ├── smart-matching/page.tsx
│   │   ├── cart/page.tsx
│   │   ├── checkout/page.tsx
│   │   ├── orders/page.tsx
│   │   ├── orders/[id]/page.tsx
│   │   └── rfq/page.tsx
│   ├── (supplier)/               # Supplier protected routes
│   │   ├── dashboard/page.tsx
│   │   ├── batches/page.tsx          # Inventory List
│   │   ├── batches/new/page.tsx      # Add Batch Wizard
│   │   ├── batches/[id]/page.tsx     # Batch Detail
│   │   ├── orders/page.tsx           # Pesanan Masuk
│   │   ├── orders/[id]/page.tsx
│   │   ├── wallet/page.tsx
│   │   └── rfq/page.tsx
│   └── (admin)/                  # Admin protected routes
│       ├── dashboard/page.tsx
│       ├── suppliers/page.tsx        # Validasi Supplier
│       ├── suppliers/[id]/page.tsx
│       ├── qc/page.tsx               # QC Queue
│       ├── qc/[batchId]/page.tsx     # Input Lab Results
│       ├── products/page.tsx         # Product Approval
│       └── transactions/page.tsx     # Monitoring
│
├── components/
│   ├── ui/                       # Base UI Components (Design System)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── Table.tsx
│   │   ├── Tabs.tsx
│   │   ├── Dropdown.tsx
│   │   ├── Slider.tsx
│   │   ├── Stepper.tsx           # Step wizard progress
│   │   ├── Skeleton.tsx          # Loading skeleton
│   │   └── EmptyState.tsx
│   │
│   ├── layout/                   # Layout Components
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Breadcrumb.tsx
│   │   ├── Footer.tsx
│   │   ├── DashboardLayout.tsx
│   │   └── BottomNavigation.tsx  # Mobile
│   │
│   ├── marketplace/              # Marketplace Components
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── FilterSidebar.tsx
│   │   ├── SortBar.tsx
│   │   ├── ChemicalParameterCard.tsx
│   │   ├── ChemicalRadarChart.tsx
│   │   ├── BatchBadge.tsx
│   │   └── VerifiedBadge.tsx
│   │
│   ├── quality/                  # Quality Components
│   │   ├── CoAViewer.tsx
│   │   ├── LabResultChart.tsx
│   │   ├── VerificationStatus.tsx  # Timeline stepper
│   │   ├── QCInputForm.tsx
│   │   └── VerifiedSignature.tsx
│   │
│   ├── traceability/             # Traceability Components
│   │   ├── QRScanner.tsx
│   │   ├── QRCodeDisplay.tsx
│   │   ├── TimelineHistory.tsx
│   │   ├── LocationMap.tsx
│   │   └── BatchSummaryCard.tsx
│   │
│   ├── transaction/              # Transaction Components
│   │   ├── CartItem.tsx
│   │   ├── CartSummary.tsx
│   │   ├── CheckoutWizard.tsx
│   │   ├── ShippingCalculator.tsx
│   │   ├── OrderCard.tsx
│   │   ├── OrderStatusBadge.tsx
│   │   ├── ShipmentTracker.tsx
│   │   └── InvoiceDownload.tsx
│   │
│   ├── wallet/                   # Wallet Components
│   │   ├── BalanceCard.tsx
│   │   ├── TransactionList.tsx
│   │   ├── WithdrawalForm.tsx
│   │   └── WithdrawalHistory.tsx
│   │
│   ├── matching/                 # Smart Matching Components
│   │   ├── CriteriaForm.tsx
│   │   ├── RecommendationTable.tsx
│   │   └── MatchScoreBadge.tsx
│   │
│   ├── rfq/                      # RFQ Components
│   │   ├── RFQForm.tsx
│   │   ├── RFQList.tsx
│   │   ├── RFQDetail.tsx
│   │   └── RFQResponseForm.tsx
│   │
│   ├── dashboard/                # Dashboard Components
│   │   ├── KPICard.tsx
│   │   ├── AlertBar.tsx
│   │   ├── ActivityLog.tsx
│   │   ├── MiniTable.tsx
│   │   └── QuickActions.tsx
│   │
│   └── admin/                    # Admin Components
│       ├── SupplierValidator.tsx
│       ├── QCQueue.tsx
│       ├── DocumentViewer.tsx
│       └── TransactionMonitor.tsx
│
├── features/                     # Feature-level logic (hooks, services, stores)
│   ├── auth/
│   │   ├── useAuth.ts            # Auth hook
│   │   ├── authStore.ts          # Zustand store
│   │   └── authService.ts        # API calls
│   ├── product/
│   │   ├── useProducts.ts
│   │   ├── productStore.ts
│   │   └── productService.ts
│   ├── quality/
│   │   ├── useQC.ts
│   │   └── qualityService.ts
│   ├── traceability/
│   │   ├── useTraceability.ts
│   │   └── traceService.ts
│   ├── transaction/
│   │   ├── useCart.ts
│   │   ├── useOrders.ts
│   │   ├── cartStore.ts
│   │   └── transactionService.ts
│   ├── wallet/
│   │   ├── useWallet.ts
│   │   └── walletService.ts
│   ├── matching/
│   │   ├── useMatching.ts
│   │   └── matchingService.ts
│   └── rfq/
│       ├── useRFQ.ts
│       └── rfqService.ts
│
├── lib/                          # Utility & configuration
│   ├── api.ts                    # Axios/fetch instance
│   ├── constants.ts              # API URLs, enums
│   ├── utils.ts                  # Helper functions
│   └── validations.ts            # Zod schemas
│
├── styles/
│   └── globals.css               # Tailwind + design tokens CSS variables
│
└── types/                        # TypeScript type definitions
    ├── user.ts
    ├── product.ts
    ├── quality.ts
    ├── order.ts
    ├── wallet.ts
    └── rfq.ts
```

### 10.2 Component Development Priority

| Prioritas | Component Group | Sprint | Jumlah Components |
|-----------|----------------|--------|-------------------|
| 1 | **UI Base** (Button, Input, Card, Badge, Modal, Toast) | Sprint 1 | 12 |
| 2 | **Layout** (Navbar, Sidebar, Breadcrumb, Footer) | Sprint 1 | 6 |
| 3 | **Marketplace** (ProductCard, Filter, Chart, Badge) | Sprint 2 | 8 |
| 4 | **Dashboard** (KPI, AlertBar, MiniTable, QuickActions) | Sprint 2 | 5 |
| 5 | **Quality** (CoAViewer, LabChart, VerificationStatus) | Sprint 3 | 5 |
| 6 | **Traceability** (QRScanner, Timeline, Map) | Sprint 3 | 5 |
| 7 | **Transaction** (Cart, Checkout, OrderCard, Tracker) | Sprint 4 | 8 |
| 8 | **Wallet** (Balance, TransactionList, WithdrawalForm) | Sprint 4 | 4 |
| 9 | **Matching** (CriteriaForm, RecommendationTable) | Sprint 5 | 3 |
| 10 | **RFQ** (RFQForm, RFQList, RFQDetail) | Sprint 5 | 4 |

---

## 11. Testing Strategy

### 11.1 Unit Testing

**Framework:** Jest + React Testing Library (Frontend), Jest (Backend)

| Kategori | Target | Contoh Test Case |
|----------|--------|-----------------|
| **Frontend Components** | Seluruh base UI components dan feature components | ProductCard renders PA% bar dengan warna benar (< 28% = warning, ≥ 28% = success). VerifiedBadge menampilkan variant yang benar. FilterSidebar emit filter values yang tepat. |
| **Frontend Hooks** | Custom hooks (useAuth, useProducts, useCart) | useCart menambah item dengan benar. useAuth redirect ke login saat token expired. |
| **Backend Services** | Auth, Product, QC, Transaction, Matching, Wallet services | AuthService hash password dan validate credentials. MatchingService menghitung Euclidean Distance score yang benar. WalletService menolak withdrawal melebihi saldo. |
| **Backend Guards** | JWT Guard, RBAC Guard | JwtGuard menolak request tanpa token. RBACGuard menolak Buyer mengakses endpoint Admin. |
| **Utility Functions** | Validasi, kalkulasi, formatting | Format batch code VLM-YYYY-NNNN benar. Kalkulasi ongkir berdasarkan berat. |

### 11.2 Integration Testing

**Framework:** Supertest (Backend API), Playwright (E2E Frontend)

| Kategori | Target | Contoh Test Case |
|----------|--------|-----------------|
| **API Integration** | Seluruh endpoint REST API | `POST /api/auth/register` → `POST /api/auth/login` → `GET /api/auth/me` returns user data yang benar. `POST /api/products/batches` → `GET /api/supplier/batches` includes batch baru. |
| **Database Integration** | Prisma operations, data integrity | Order creation mengurangi `available_volume_kg` di products. QC approval otomatis membuat entry di `certificates` dan `trace_logs`. Wallet credit terjadi setelah order completed. |
| **Cross-Module** | Interaksi antar module | Supplier create batch → Admin input QC → Batch status VERIFIED → Muncul di marketplace API → Buyer dapat add to cart → Checkout → Order created → Supplier wallet credited. |

### 11.3 User Acceptance Testing (UAT)

#### Skenario Supplier (Pak Darmawan)

| # | Skenario | Langkah | Expected Result |
|---|----------|---------|-----------------|
| S1 | Register sebagai Supplier | Buka register → pilih Supplier → isi form koperasi → submit | Akun terbuat, email verifikasi terkirim |
| S2 | Tambah batch produk | Login → Dashboard → + Tambah Batch → isi wizard 3 langkah → submit | Batch muncul di inventory dengan status DRAFT |
| S3 | Pantau status QC | Dashboard → lihat status batch | Status berubah: DRAFT → IN_LAB → VERIFIED (setelah admin input QC) |
| S4 | Lihat produk aktif di marketplace | Dashboard → lihat batch ACTIVE | Batch muncul di katalog marketplace dengan Verified Badge |
| S5 | Terima dan konfirmasi pesanan | Dashboard → Pesanan Masuk → Detail → Konfirmasi → Upload resi | Status order CONFIRMED → SHIPPED |
| S6 | Lihat wallet dan withdraw | Dashboard → Wallet → lihat saldo → isi form withdrawal → submit | Saldo tercatat, withdrawal status PENDING |
| S7 | Download QR Code | Inventory → Detail Batch → Download QR PDF | File PDF terunduh dengan QR Code siap cetak |

#### Skenario Buyer (Larasati)

| # | Skenario | Langkah | Expected Result |
|---|----------|---------|-----------------|
| B1 | Register sebagai Buyer | Buka register → pilih Buyer → isi form bisnis → submit | Akun terbuat, email verifikasi terkirim |
| B2 | Browse marketplace dengan filter | Login → Marketplace → set filter PA% ≥ 28% → Terapkan | Hanya produk dengan PA% ≥ 28% yang ditampilkan |
| B3 | Lihat product detail | Klik product card → Product Detail page | Radar chart parameter kimia, tabel parameter, info supplier tampil |
| B4 | Verifikasi Digital CoA | Product Detail → tab Digital CoA | CoA viewer dengan parameter, tanda tangan digital, tombol download PDF |
| B5 | Scan QR traceability | Klik "Scan QR" → scan/input batch ID | Halaman traceability: timeline perjalanan + peta koordinat kebun |
| B6 | Smart Matching | Menu Smart Matching → isi kriteria → Temukan | Tabel 5 rekomendasi batch dengan Match Score |
| B7 | Checkout | Add to Cart → Cart → Checkout wizard → Pembayaran | Order terbuat, redirect ke payment gateway, konfirmasi pembayaran |
| B8 | Track pesanan | Order History → Detail Order → Shipment Tracker | Nomor resi, progress pengiriman, estimasi tiba |
| B9 | Submit RFQ | Product Detail → Ajukan RFQ → isi form → submit | RFQ terkirim ke supplier, notifikasi terkirim |

#### Skenario Admin

| # | Skenario | Langkah | Expected Result |
|---|----------|---------|-----------------|
| A1 | Validasi supplier baru | Dashboard → Validasi Supplier → review dokumen → Approve | Supplier status berubah ke ACTIVE, notifikasi terkirim |
| A2 | Input hasil lab dan generate CoA | Dashboard → QC Queue → pilih batch → input parameter → Submit | QC result tersimpan, CoA ter-generate, QR Code ter-generate, batch status VERIFIED |
| A3 | Reject batch QC | QC Queue → pilih batch → input parameter (di bawah standar) → Reject | Batch status REJECTED, supplier menerima notifikasi dengan alasan |
| A4 | Monitor transaksi | Dashboard → Monitoring Transaksi → filter status → export CSV | Tabel transaksi dengan filter, download CSV |

### 11.4 Performance Testing

| Metrik | Target (dari NFR PRD) | Tools |
|--------|----------------------|-------|
| Load time katalog marketplace | < 2.5 detik | Lighthouse, WebPageTest |
| Smart Matching response time | < 500ms | k6, custom benchmark |
| Lighthouse Performance Score | ≥ 90 | Lighthouse CI |
| Lighthouse Accessibility Score | ≥ 90 | Lighthouse CI |
| Time to First Byte (TTFB) | < 200ms | Vercel Analytics |
| Largest Contentful Paint (LCP) | < 2.5 detik | Web Vitals |

---

## 12. Security Implementation

### 12.1 Authentication & Authorization

| Aspek | Implementasi | Referensi PRD |
|-------|-------------|---------------|
| **JWT Authentication** | Access Token (JWT, 15 menit expiry, signed HS256). Refresh Token (7 hari, httpOnly cookie, secure flag). Token rotation pada setiap refresh. | NFR Security: "Token JWT terenkripsi" |
| **Password Security** | Bcrypt hashing (salt rounds: 12). Password minimum 8 karakter, harus mengandung huruf besar, kecil, angka. Rate limiting login (5 attempts / 15 menit). | — |
| **Role-Based Access Control** | 3 role: Supplier, Buyer, Admin. Setiap endpoint dilindungi decorator `@Roles()`. Supplier tidak bisa mengakses endpoint Admin. Buyer tidak bisa membuat batch produk. | FR-01 |
| **Email Verification** | Registrasi memerlukan verifikasi email. Token verifikasi (1 jam expiry). Akun belum verified tidak bisa login. | — |

### 12.2 Data Protection

| Aspek | Implementasi |
|-------|-------------|
| **HTTPS** | Seluruh transmisi data menggunakan TLS/HTTPS. HTTP redirect ke HTTPS. HSTS header aktif. |
| **Input Validation** | Validasi di frontend (Zod schema) dan backend (class-validator NestJS). Sanitize semua input string (XSS prevention). Parameterized queries (Prisma — SQL injection prevention). |
| **Data Encryption** | Password: bcrypt hash. Sensitive data (bank account): AES-256 encryption at rest. API keys: environment variables (tidak hardcoded). |
| **File Upload** | Validasi file type (whitelist: jpg, png, pdf). Max file size: 10 MB. Virus scan (opsional). File disimpan di cloud storage dengan access control. |
| **CORS** | Whitelist domain frontend saja. Strict origin policy. Credentials: true (untuk cookie). |

### 12.3 API Security

| Aspek | Implementasi |
|-------|-------------|
| **Rate Limiting** | Global: 100 request / menit per IP. Auth endpoints: 10 request / 15 menit per IP. Menggunakan Redis counter. |
| **Request Validation** | DTO validation (NestJS class-validator) di semua endpoints. Reject request dengan field tidak dikenal (whitelist approach). |
| **Error Handling** | Tidak menampilkan stack trace di production. Generic error message ke client. Detailed logging ke server (Sentry). |
| **Helmet** | NestJS Helmet middleware: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection headers. |

### 12.4 CoA Document Security

| Aspek | Implementasi | Referensi PRD |
|-------|-------------|---------------|
| **Akses CoA** | CoA hanya bisa dilihat oleh Buyer yang sudah login (Design.md §7.5: "memerlukan login"). Download PDF juga memerlukan autentikasi. | "CoA tidak bisa diunduh tanpa login" |
| **Tanda Tangan Digital** | Nama admin, jabatan, dan timestamp tersimpan di database. Tidak menggunakan digital signature kriptografi pada MVP, tetapi QR verifikasi pada dokumen mengarah ke halaman traceability resmi. | — |
| **QR Verification** | QR Code pada CoA berisi URL ke halaman traceability publik. Siapa pun yang scan QR bisa memverifikasi keaslian batch. | — |

---

## 13. Deployment Plan

### 13.1 Environment Strategy

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Development Environment (Local)                                 │
│  ─────────────────────────────────                               │
│  Frontend: localhost:3000 (Next.js dev server)                   │
│  Backend:  localhost:3001 (NestJS dev server)                    │
│  Database: localhost:5432 (PostgreSQL local / Docker)            │
│  Redis:    localhost:6379 (Redis local / Docker)                 │
│                                                                  │
│  Trigger: Setiap push ke branch feature/*                        │
│                                                                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │ PR merge ke branch `staging`
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Staging Environment                                             │
│  ─────────────────                                               │
│  Frontend: staging.valam.id (Vercel Preview)                     │
│  Backend:  api-staging.valam.id (Railway staging)                │
│  Database: PostgreSQL staging instance                           │
│  Redis:    Redis staging instance                                │
│                                                                  │
│  Trigger: PR merge ke branch `staging`                           │
│  Purpose: QA testing, UAT, stakeholder demo                     │
│                                                                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │ PR merge ke branch `main`
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Production Environment                                          │
│  ──────────────────                                              │
│  Frontend: www.valam.id (Vercel Production)                      │
│  Backend:  api.valam.id (Railway production)                     │
│  Database: PostgreSQL production (daily backup)                  │
│  Redis:    Redis production (persistence enabled)                │
│                                                                  │
│  Trigger: PR merge ke branch `main` (requires approval)         │
│  Purpose: Live platform untuk pengguna                           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 13.2 CI/CD Pipeline (GitHub Actions)

```yaml
# Workflow: On push/PR to staging or main

1. Checkout code
2. Install dependencies (npm ci)
3. Lint check (ESLint + Prettier)
4. Type check (TypeScript compiler)
5. Unit tests (Jest)
6. Integration tests (Supertest)
7. Build frontend (next build)
8. Build backend (nest build)
9. Deploy to environment:
   - staging branch → Staging
   - main branch → Production
10. Smoke test pada deployed URL
11. Notify team (Slack/Discord)
```

### 13.3 Deployment Checklist

#### Database Deployment
- [ ] Run Prisma migration (`npx prisma migrate deploy`)
- [ ] Verify semua tabel terbuat
- [ ] Seed admin account
- [ ] Verify backup schedule aktif
- [ ] Test connection pooling

#### Backend Deployment
- [ ] Set environment variables (DATABASE_URL, JWT_SECRET, REDIS_URL, MIDTRANS_KEY, SENDGRID_KEY, GOOGLE_MAPS_KEY, CLOUD_STORAGE_KEY)
- [ ] Verify health check endpoint (`/api/health`)
- [ ] Verify Swagger docs accessible (`/api/docs`)
- [ ] Test CORS configuration
- [ ] Verify rate limiting aktif
- [ ] Test email service (send test email)

#### Frontend Deployment
- [ ] Set environment variables (NEXT_PUBLIC_API_URL, NEXT_PUBLIC_GOOGLE_MAPS_KEY, NEXT_PUBLIC_MIDTRANS_CLIENT_KEY)
- [ ] Verify build successful (no TypeScript errors)
- [ ] Test SSR/SSG pages render correctly
- [ ] Verify responsive design pada 3 breakpoints
- [ ] Test image optimization (Next.js Image)
- [ ] Verify SEO meta tags

#### Post-Deployment
- [ ] Smoke test seluruh critical path (register, login, browse, checkout)
- [ ] Verify Sentry error tracking aktif
- [ ] Verify Vercel Analytics collecting data
- [ ] Monitor error rate (< 0.1% acceptable)
- [ ] Monitor response time (< 500ms API average)

---

## 14. Project Timeline

| Minggu | Sprint | Aktivitas Utama | Output |
|--------|--------|----------------|--------|
| **Minggu 1** | Sprint 1 | Setup project (Next.js, NestJS, PostgreSQL, Prisma). Implementasi design system (CSS variables, base components). Database schema awal (users, roles, profiles). | Repository tersetup, design system ready, database schema v1 |
| **Minggu 2** | Sprint 1 | Autentikasi: Register multi-role, Login, JWT, RBAC. Landing page. Email verification. | Auth end-to-end, landing page, Swagger docs |
| **Minggu 3** | Sprint 2 | Marketplace page: Product Card, Filter sidebar, Sort. Backend: Product API dengan filter/pagination. Database: products, batches, product_parameters. | Marketplace browsable, product data seeded |
| **Minggu 4** | Sprint 2 | Product Detail page (radar chart, tab navigation). Supplier Dashboard (KPI, quick actions). Add Batch Wizard (3 langkah). Inventory List. | Supplier dapat menambah batch, Buyer dapat melihat detail produk |
| **Minggu 5** | Sprint 3 | Admin Dashboard. QC Management (input lab results). Digital CoA Viewer. Database: qc_results, certificates. | Admin dapat input QC, CoA ter-generate |
| **Minggu 6** | Sprint 3 | QR Code generation. Traceability page publik (timeline + peta). Verification Status tracker. QR Scanner component. Admin Supplier Validation. | Traceability end-to-end, QR Code downloadable |
| **Minggu 7** | Sprint 4 | Cart component. Checkout wizard (3 langkah). Backend: order, cart, payment API. Database: orders, payments, cart_items. Midtrans integration. | Buyer dapat checkout dan bayar |
| **Minggu 8** | Sprint 4 | Order management (Buyer + Supplier). Shipment tracker. Supplier Wallet (saldo, withdrawal). Database: shipments, wallets, wallet_transactions, withdrawals. | Transaksi end-to-end, wallet fungsional |
| **Minggu 9** | Sprint 5 | Smart Matching: form kriteria, algoritma MCDM (Euclidean Distance), recommendation table. Performance optimization (< 500ms). | Smart Matching fungsional |
| **Minggu 10** | Sprint 5 | RFQ module: submit form, list, response. Notification integration (in-app + email). Database: rfq_requests, rfq_responses. | RFQ end-to-end |
| **Minggu 11** | Sprint 6 | Integration testing seluruh module. UAT (Supplier, Buyer, Admin scenarios). Bug fixes. Responsive design fixes. Empty states & error messages. | All tests passed, bugs fixed |
| **Minggu 12** | Sprint 6 | Performance optimization (Lighthouse ≥ 90). Security hardening (OWASP). CI/CD finalization. Staging deployment & testing. Production deployment. Monitoring setup. | **MVP DEPLOYED TO PRODUCTION** |

---

## 15. Team Task Distribution

### 15.1 Role & Responsibilities

#### Frontend Developer (2 orang)

| Responsibility | Deliverable |
|----------------|-------------|
| Implementasi design system Valam (CSS variables, Tailwind config) | `globals.css` dengan design tokens, Tailwind preset |
| Build semua UI components sesuai Design.md | 60+ React components terdokumentasi |
| Implementasi semua halaman (Landing, Marketplace, Dashboard, Detail, CoA, dll) | 20+ pages responsif |
| Integrasi API backend (fetch, state management) | Feature hooks & services |
| Responsif design (desktop, tablet, mobile) sesuai Design.md §9 | Responsive pada semua breakpoints |
| Performance optimization (Lighthouse ≥ 90) | Fast load times sesuai NFR |
| Accessibility compliance (WCAG AA) sesuai Design.md §10 | Kontras, keyboard nav, screen reader |

**Pembagian:**
- **Frontend Dev 1:** Landing page, Auth pages, Marketplace, Product Detail, Smart Matching, CoA Viewer
- **Frontend Dev 2:** Supplier Dashboard, Admin Dashboard, Batch Wizard, Cart/Checkout, Wallet, Order Management, Traceability

#### Backend Developer (2 orang)

| Responsibility | Deliverable |
|----------------|-------------|
| Setup NestJS project architecture (modular) | Scalable project structure |
| Implementasi semua REST API endpoints (50+ endpoints) | Functioning API sesuai spec |
| JWT authentication dan RBAC authorization | Secure auth system |
| Database schema design dan Prisma migration | 18+ tabel dengan relasi |
| Integrasi external services (Midtrans, email, cloud storage) | Payment, email, file upload |
| Performance optimization (Redis caching, query optimization) | Katalog < 2.5s, Matching < 500ms |
| API documentation (Swagger) | Complete API docs |
| Security hardening (input validation, rate limiting, CORS) | OWASP compliance |

**Pembagian:**
- **Backend Dev 1:** Auth Module, Product Module, Quality Module, Traceability Module, Notification Module
- **Backend Dev 2:** Transaction Module, Wallet Module, Matching Module, RFQ Module, Admin Module, Payment Integration

#### UI/UX Designer (1 orang)

| Responsibility | Deliverable |
|----------------|-------------|
| High-fidelity mockup semua halaman (Figma) berdasarkan Design.md | 20+ screen designs |
| Design system component library di Figma | Figma component library |
| Prototyping user flow (Buyer, Supplier, Admin) | Interactive prototype |
| Responsive design mockup (desktop, tablet, mobile) | 3 breakpoint per halaman |
| Design review setiap sprint (validasi implementasi vs design) | Review report per sprint |
| Iterasi berdasarkan feedback UAT | Updated designs |

#### Database Engineer / DevOps (1 orang)

| Responsibility | Deliverable |
|----------------|-------------|
| Database schema design dan normalization (3NF) | ERD diagram, Prisma schema |
| Database seeding (mock data realistis) | Seed script dengan 50+ records |
| Query optimization dan indexing | Optimal query performance |
| CI/CD pipeline setup (GitHub Actions) | Automated test & deploy |
| Infrastructure provisioning (Vercel, Railway, PostgreSQL, Redis) | Environments ready |
| Monitoring setup (Sentry, Vercel Analytics) | Error tracking & performance monitoring |
| Backup strategy implementation | Daily automated backups |

#### QA Tester (1 orang)

| Responsibility | Deliverable |
|----------------|-------------|
| Test plan creation berdasarkan PRD dan Design.md | Test plan document |
| Unit test writing (frontend components, backend services) | Test coverage ≥ 80% |
| Integration test writing (API, database) | All critical paths tested |
| UAT execution (Supplier, Buyer, Admin scenarios) | UAT report |
| Performance testing (Lighthouse, load testing) | Performance report |
| Security testing (OWASP checklist) | Security audit report |
| Bug reporting dan regression testing | Bug tracker up-to-date |
| Cross-browser dan cross-device testing | Compatibility report |

---

## 16. Risk Management

| # | Risk | Probability | Impact | Mitigation Strategy |
|---|------|-------------|--------|---------------------|
| 1 | **Data QC laboratorium belum tersedia** — Pada fase MVP awal, belum ada data hasil lab nyata untuk ditampilkan. | Tinggi | Tinggi — Produk di katalog tidak bisa menampilkan parameter kimia yang terverifikasi. | Gunakan **mock laboratory data** yang realistis (PA% 28-35%, Moisture 1-2%, dll berdasarkan standar ISO minyak nilam). Buat database seeder dengan 20+ batch data mock. Tandai dengan label "Demo Data" di staging. |
| 2 | **Integrasi Payment Gateway (Midtrans) memakan waktu lebih lama** — Proses onboarding merchant Midtrans bisa memakan 1-2 minggu. | Sedang | Sedang — Checkout flow tidak bisa diuji end-to-end. | Mulai proses pendaftaran merchant Midtrans di **Sprint 1**. Gunakan **Midtrans Sandbox** selama development. Siapkan fallback manual transfer sebagai payment method alternatif. |
| 3 | **Google Maps API quota limit** — Halaman traceability yang sering diakses publik bisa menghabiskan quota free tier. | Sedang | Rendah — Peta tidak tampil, tetapi data timeline tetap ada. | Gunakan **Leaflet + OpenStreetMap** sebagai fallback gratis. Implementasi caching peta (static map image) untuk batch yang sering diakses. Set billing alert pada Google Cloud Console. |
| 4 | **Performance katalog tidak memenuhi NFR (< 2.5 detik)** — Jika jumlah produk besar dan query tidak optimal. | Sedang | Tinggi — Buyer meninggalkan platform karena lambat. | Implementasi **Redis caching** untuk katalog (cache invalidation setiap ada produk baru/updated). Gunakan Next.js **SSR/ISR** untuk pre-render halaman marketplace. Database indexing pada kolom filter (status, PA%, price, origin). Pagination (bukan load-all). |
| 5 | **Supplier kesulitan menggunakan platform** — Persona Pak Darmawan (48 tahun, literasi digital dasar) mungkin kebingungan. | Sedang | Sedang — Adoption rate rendah, platform tidak berguna tanpa supplier aktif. | Desain Supplier interface sesederhana mungkin (wizard 3 langkah, tombol besar, panduan visual). Implementasi **onboarding tour** saat pertama kali login. Sediakan **tooltip dan bantuan inline** di setiap form field. Uji UAT dengan pengguna proxy non-teknis. |
| 6 | **Scope creep — stakeholder menambahkan fitur di luar MVP** — Tekanan untuk menambah fitur Cross-Border, AI, dll. | Sedang | Tinggi — Timeline molor, kualitas menurun. | Gunakan **MoSCoW framework** dari PRD sebagai rujukan tegas. Setiap request fitur baru dievaluasi: apakah Must Have / Should Have / Could Have? Jika Won't Have untuk MVP, masukkan ke backlog Post-MVP. Sprint review menjadi checkpoint alignment. |
| 7 | **Koordinasi frontend-backend tidak sinkron** — Frontend menunggu API yang belum siap, atau API berubah tanpa notifikasi. | Sedang | Sedang — Bottleneck development, waktu terbuang. | **API contract-first approach**: definisikan endpoint dan response format di Swagger sebelum development. Frontend gunakan **MSW (Mock Service Worker)** untuk mock API selama backend belum siap. Daily standup untuk sinkronisasi. |
| 8 | **Regulasi pembayaran B2B** — Transaksi B2B skala besar mungkin memiliki regulasi khusus (faktur pajak, dll). | Rendah | Sedang — Fitur checkout tidak compliance. | Konsultasi dengan tim legal/akuntan Valam di Sprint 1. Untuk MVP, fokus pada **transaksi domestik skala UMKM**. Fitur invoice/faktur pajak bisa ditambahkan sebagai enhancement. |

---

## 17. Definition of Done

Sebuah fitur dianggap **"Done"** jika memenuhi seluruh kriteria berikut:

### Kriteria Wajib

| # | Kriteria | Verifikasi |
|---|----------|------------|
| ✓ | **UI sesuai Design.md** | Visual implementation match dengan spesifikasi Design.md (color, typography, spacing, component structure). Divalidasi oleh UI/UX Designer pada sprint review. |
| ✓ | **API berjalan** | Endpoint REST API berfungsi sesuai spesifikasi (method, request, response, error handling). Terdokumentasi di Swagger. Divalidasi oleh QA Tester. |
| ✓ | **Database tersimpan** | Data tersimpan dengan benar di PostgreSQL. Relasi antar tabel valid. Migration berjalan tanpa error. Divalidasi oleh Database Engineer. |
| ✓ | **Testing berhasil** | Unit test passed (coverage ≥ 80%). Integration test passed. Tidak ada failing test di CI pipeline. |
| ✓ | **Responsive** | Halaman tampil dan berfungsi dengan benar pada 3 breakpoints: Desktop (1280px+), Tablet (768px–1279px), Mobile (< 768px). Sesuai Design.md §9. |
| ✓ | **Accessible** | Memenuhi WCAG 2.1 AA: kontras warna, keyboard navigation, screen reader compatible, focus states, form labels. Sesuai Design.md §10. |
| ✓ | **Performance** | Load time < 2.5 detik (untuk halaman katalog). API response < 500ms (untuk Smart Matching). Lighthouse Performance Score ≥ 90. |
| ✓ | **Security** | Endpoint terproteksi JWT + RBAC. Input tervalidasi. Tidak ada data sensitif ter-expose. |
| ✓ | **Code quality** | Lulus ESLint check. TypeScript strict mode (no `any`). Kode terdokumentasi (JSDoc untuk fungsi kompleks). PR telah di-review oleh 1 developer lain. |
| ✓ | **Error handling** | Empty states terimplementasi sesuai UX Writing (Design.md §11). Error messages informatif. Loading states (skeleton) tampil saat fetching data. |

### Checklist per Sprint

```
□ Semua task di sprint backlog selesai
□ Sprint demo berhasil — stakeholder menyetujui output
□ Tidak ada critical/high bug yang belum di-fix
□ API documentation (Swagger) ter-update
□ Database migration committed dan tested
□ CI/CD pipeline green (semua test passed)
□ Code merged ke branch staging dan terverifikasi
```

---

> **Dokumen ini merupakan *living document*.** Setiap perubahan keputusan arsitektur, penambahan fitur, atau pergeseran prioritas harus diperbarui di sini dan dikomunikasikan pada sprint review.

**Versi:** 1.0  
**Terakhir Diperbarui:** 24 Juni 2026  
**Repository:** [github.com/C4R4MeL/Valam-](https://github.com/C4R4MeL/Valam-.git)  
**Disusun Berdasarkan:** [PRD.md](file:///d:/UTU%20Awards%20Project/PRD.md) | [Design.md](file:///d:/UTU%20Awards%20Project/design.md)  
**Status:** ✅ Siap digunakan sebagai blueprint development
