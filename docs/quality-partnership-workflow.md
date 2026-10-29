# Alur kemitraan pengujian dan informasi mutu VALAM

Tanggal: 27 Oktober 2026. Branch kerja: `codex/quality-partnership-workflow`.

## Audit dan keputusan implementasi

Tidak ditemukan `AGENTS.md` pada repository maupun direktori induk yang diperiksa. Pengerjaan menggunakan working tree terbaru yang sudah berisi perubahan pengguna pada autentikasi, transaksi, verifikasi pemasok, dan QC. Perubahan tersebut tidak di-reset; tidak dilakukan deployment atau migrasi ke schema operasional.

Fondasi yang digunakan kembali: NestJS, Prisma/PostgreSQL, JWT dan session revocation, `RolesGuard`, guard verifikasi pemasok untuk pendaftaran/publikasi batch, tabel `Notification`, komponen UI, routing `next-intl`, serta penyimpanan dokumen pemasok yang sudah ada.

Temuan dan perbaikan:

- Status produk dahulu dipakai sekaligus untuk penerimaan sampel dan kesiapan katalog. Proses baru disimpan pada pengajuan tersendiri, terpisah dari pemeriksaan dokumen dan evaluasi mutu.
- Endpoint lama masih dapat membuat PDF berjudul CoA dengan nama admin dan domain QR permanen. Pembangkit itu dihapus. Endpoint CoA lama mengembalikan 404 dan mengarahkan integrasi ke laporan sumber yang diperiksa. Penerimaan sampel lewat endpoint batch lama dihentikan (410); pencatatan harus melalui pengajuan.
- Seed lama membuat sertifikat, penandatangan contoh, nilai `pass`, dan kejadian seolah-olah produk lulus uji. Sertifikat fiktif baru tidak dibuat lagi. Fixture numerik ditandai demonstrasi, tidak dievaluasi, dan tidak memperoleh badge.
- Instruksi tetap 50 ml, alamat ARC yang belum dikonfirmasi, dan klaim metode GC-MS untuk semua batch dihapus dari panduan pengiriman. Kebutuhan layanan berasal dari konfigurasi mitra.
- Metrik pendapatan QC sebelumnya menghitung sertifikat × Rp250.000. Tarif tersebut tidak memiliki dasar terkonfirmasi: pendapatan QC sekarang `null`/tidak tersedia dan tidak ditambahkan ke pendapatan tercatat.
- Publikasi katalog sebelumnya memakai nilai QC lama tanpa pemeriksaan sumber. Katalog, profil pemasok publik, ketertelusuran, dan masukan matching sekarang mengambil informasi mutu dari laporan yang telah diperiksa dan diizinkan dipublikasikan. Nilai lama tetap tersedia secara privat sebagai catatan yang perlu ditinjau. Angka jumlah pemasok/wilayah contoh pada fallback footer juga dihapus.
- Badge GC-MS generik dan penetapan tier mutu otomatis di kartu/detail katalog diganti dengan status pemeriksaan laporan dan “Belum dievaluasi”. Identitas pemasok tetap dibedakan dari laporan batch.
- Tombol unduh CoA detail produk yang hanya menampilkan alert diganti dengan akses ke laporan asli. Peta ketertelusuran tidak lagi menampilkan lokasi lahan tetap yang tidak berasal dari batch.
- Instruksi NILA menjelaskan peran mitra dan admin, ketiadaan akun ARC, dua jalur laporan, dan batas akses data. NILA tidak memiliki akses database batch dan tidak boleh menebak status, stok, hasil, atau prosedur.

## Database dan migrasi

Migrasi tambahan: `backend/prisma/migrations/20261027_quality_partnership/migration.sql`.

| Model / tabel | Kegunaan |
| --- | --- |
| `TestingPartner` / `testing_partners` | Identitas, layanan, instruksi, izin publikasi, visibilitas, dan penerimaan pengajuan |
| `TestingRequest` / `testing_requests` | Batch milik pemasok, mitra tujuan, nomor internal UUID, layanan, sampel, pengiriman, dan status proses |
| `LabReport` / `lab_reports` | Sumber asli, nomor resmi, sampel, tanggal opsional, parameter/metode, kesimpulan, pemeriksaan, izin publikasi, dan hubungan penggantian |
| `QualityFile` / `quality_files` | Lokasi file privat, pemilik unggahan, lingkup batch/mitra, nama, ukuran, dan SHA-256 |
| `QualityEvent` / `quality_events` | Waktu, pelaku/peran, tindakan, alasan, bukti opsional, dan kunci tindakan unik |
| `Certificate.review_status` | Seluruh sertifikat lama mendapat `NEEDS_REVIEW`, tanpa mengubah isi atau penerbitnya |

Migrasi menambah tabel/kolom/constraint; tidak menjatuhkan atau mengosongkan tabel lama. Relasi `RESTRICT` mempertahankan pengajuan, dokumen, dan mitra yang sudah dipakai. Tidak ada endpoint hapus permanen mitra. Batch yang memiliki riwayat pengujian tidak dapat dihapus atau diedit sebagai batch draft baru.

ARC USK ditambahkan melalui migrasi sebagai mitra aktif dan terlihat, dengan izin nama/logo/laporan sesuai konfirmasi pemilik platform. Logo, alamat, kontak, layanan rinci, biaya, kebutuhan sampel, waktu layanan, dan saluran penyerahan belum diisi. Penerimaan pengajuan ARC awalnya **ditutup**, karena layanan belum dikonfigurasi. Admin membuka penerimaan setelah layanan yang disepakati tersedia. Tidak dibuat akun laboratorium.

Identitas penerbit disalin ke `issuer_snapshot` saat laporan dicatat. Penyuntingan nama mitra tidak mengganti identitas pada laporan lama. Status mitra berakhir tidak mencabut laporan lama secara otomatis. Izin publikasi tetap diperiksa ketika informasi/file publik diminta.

Laporan tidak diedit atau ditimpa. Perbaikan menggunakan unggahan laporan baru dengan `replaces_id`. Dokumen lama hanya ditandai `SUPERSEDED` ketika penggantinya disetujui. Penolakan atau permintaan revisi tidak menghapus file lama. Catatan QC lama yang masih dicatat melalui API kompatibilitas menyimpan snapshot sebelum/sesudah dalam `QualityEvent`; pengulangan data identik tidak menggandakan catatan.

Sertifikat lama tidak dimigrasikan menjadi laporan ARC. Admin harus mendapatkan dokumen laboratorium asli dan memeriksanya melalui alur baru. Daftar catatan lama tersedia pada halaman pengujian privat dengan label perlu ditinjau.

## Aturan alur

| Status proses | Transisi berikutnya |
| --- | --- |
| Diajukan | Menunggu pengiriman sampel, dibatalkan |
| Menunggu pengiriman sampel | Sampel dikirim, dibatalkan |
| Sampel dikirim | Sampel diterima, dibatalkan oleh admin |
| Sampel diterima | Dalam pengujian, dibatalkan oleh admin |
| Dalam pengujian | Hasil tersedia melalui persetujuan dokumen resmi, atau dibatalkan oleh admin |
| Hasil tersedia | Tidak menerima perubahan proses biasa |
| Dibatalkan | Selesai; tidak menerima laporan baru yang dikaitkan dengan pengajuan tersebut |

Pemasok hanya dapat mencatat pengiriman batch miliknya. Pembatalan pemasok dibatasi sebelum pengiriman; sesudah itu perlu koordinasi admin. Perubahan wajib mempunyai catatan/alasan. Admin mencatat penerimaan dan pengujian berdasarkan konfirmasi mitra, bukan pembaruan langsung dari akun mitra. Tidak ada transisi berdasarkan waktu berlalu.

Jika seluruh laporan yang mendasari “Hasil tersedia” dicabut, pengajuan kembali menjadi “Dalam pengujian” dengan kejadian pencabutan yang dapat diaudit. Ini tindakan eksplisit pencabutan, bukan timer. Dokumen lama tetap dapat dibaca pemilik/admin; akses publik dan badge langsung ditolak.

Dua jalur penerimaan:

1. **Melalui pengajuan:** admin/pemasok mengunggah sumber asli, mengaitkan pengajuan dan batch yang sama, serta mencatat saluran penerimaan sebenarnya. Persetujuan laporan terkait pengajuan menunggu status “Dalam pengujian”.
2. **Laporan sudah dimiliki:** pemasok mengunggah sumber asli untuk batch miliknya tanpa memilih pengajuan. Tidak dibuat pengajuan, pengiriman, atau riwayat pengujian fiktif.

Laporan baru selalu `PENDING`. Admin dapat meminta revisi, menolak keterkaitan, atau menyetujui setelah memeriksa penerbit, kecocokan batch/sampel, nomor laporan, tanggal/ketiadaannya, serta kelengkapan dan sumber. Persetujuan merupakan pemeriksaan keterkaitan oleh VALAM; bukan penerbitan atau pengesahan hasil laboratorium oleh VALAM.

Hasil/kesimpulan laboratorium disimpan sebagai isi dokumen. Evaluasi terhadap standar selalu `UNEVALUATED` pada implementasi ini: belum ada standar kelulusan yang dikonfirmasi. Tidak dibuat angka cadangan, batas, pass, metode, atau tanggal default. Nilai nol yang benar tetap nol. Nilai tekstual tetap tersedia pada ringkasan parameter asli. Proyeksi angka katalog/matching hanya membaca nama parameter yang dikenal dengan satuan yang sesuai: PA/moisture harus `%`; satuan lain atau tidak diketahui tidak dikonversi atau ditampilkan sebagai persentase.

Persetujuan laporan nyata pada batch draft menyiapkan status produk `AWAITING_PRICE`. Pemasok masih harus menetapkan harga melalui inventori untuk mempublikasikan produk; pemeriksaan dokumen tidak otomatis mempublikasikan batch. Transaksi, RFQ, dan pembayaran tidak diubah oleh proses pengujian.

## Akses, penyimpanan, dan notifikasi

- Semua endpoint pengelolaan menggunakan JWT/session serta pembatasan admin/pemasok. Kepemilikan diperiksa di server pada pengajuan, unggahan, perubahan status, dan akses dokumen.
- Laporan hanya boleh memakai file dalam lingkup batch yang sama. Pengajuan/laporan juga harus mempunyai mitra dan batch yang cocok. Penggantian harus tetap pada batch serta penerbit yang sama.
- PDF dibatasi 5 MB, diperiksa MIME dan penanda `%PDF-`, serta disimpan dengan nama unik dan checksum. File sumber tidak dimodifikasi, diberi tanda tangan, atau digabung dengan logo mitra.
- Penyimpanan memakai `supplier-documents` hanya setelah metadata bucket dikonfirmasi privat. Bila bucket publik/izin metadata tidak memadai/tidak tersedia, file mutu disimpan pada disk privat, mengikuti pola fallback existing. Lingkungan yang memakai fallback memerlukan penyimpanan disk yang persisten. File quality tidak disajikan sebagai direktori statis. File mitra adalah dokumen kerja sama internal dan hanya dapat dibaca admin.
- Pratinjau/unduhan membaca file sumber yang sama. Backend memeriksa izin lalu men-stream file lokal atau mengunduh objek privat dari storage untuk di-stream. Token JWT tidak dimasukkan ke URL. Respons memakai `private, no-store`, `nosniff`, dan sandbox PDF.
- Publik hanya memperoleh laporan `APPROVED`, bukan demonstrasi, untuk batch katalog terpublikasi, dengan izin publikasi per laporan dan per mitra. Kontak, dokumen kerja sama, catatan admin, lokasi storage, dan identitas akun pemeriksa tidak ada pada proyeksi laporan publik.
- Pencabutan/penggantian memengaruhi API detail produk dan QR pada pembacaan berikutnya. Komponen laporan publik memuat ulang ketika fokus kembali dan setiap 30 detik; URL file tetap memeriksa izin pada setiap permintaan. File yang sudah diunduh pengguna merupakan salinan mereka.
- Kunci pengajuan/laporan/tindakan unik dan transaksi serializable dengan retry mencegah notifikasi/kejadian ganda akibat pengiriman ulang atau persaingan transaksi. Pengajuan aktif yang sama juga ditolak meskipun memakai kunci baru.
- Notifikasi disimpan pada tabel `Notification` untuk pengajuan tercatat, sampel diterima, revisi dokumen, dan hasil tersedia; ditampilkan pada halaman pemasok. Tidak ada klaim pengiriman email/WhatsApp.

## Halaman dan API

Halaman baru/utama, tersedia di `/id` dan `/en`:

- `/dashboard/admin/testing-partners`: daftar, tambah, edit, detail, izin, layanan, dan dokumen kerja sama internal.
- `/dashboard/admin/qc`: pengajuan, progres berdasarkan konfirmasi mitra, unggahan, dan pemeriksaan laporan.
- `/dashboard/supplier/testing`: pengajuan, riwayat, dua jalur unggahan, notifikasi, catatan revisi, dan file asli milik pemasok.
- Beranda: mitra dari database mengikuti izin/visibilitas.
- `/katalog/:id` dan `/traceability/:batchCode`: laporan yang masih berlaku dan diizinkan, termasuk identitas penerbit saat pencatatan.

API di bawah prefix `/api`:

| Endpoint | Akses |
| --- | --- |
| `GET /quality/partners` | Publik; tanpa kontak privat |
| `GET /quality/batches/:id/reports` | Publik; laporan yang boleh ditampilkan |
| `GET /quality/reports/:id/source[?download=1]` | Publik; izin dicek kembali |
| `GET /quality/manage` | Admin/pemasok; data dibatasi kepemilikan |
| `GET /quality/manage/partners` | Pilihan mitra aktif yang menerima pengajuan |
| `GET /quality/manage/issuers` | Pilihan penerbit, termasuk yang sudah tidak menerima pengajuan |
| `GET/POST /quality/manage/admin/partners` | Admin |
| `GET/PATCH /quality/manage/admin/partners/:id` | Admin |
| `POST /quality/manage/requests` | Pemasok |
| `PATCH /quality/manage/requests/:id` | Sesuai peran dan transisi |
| `POST /quality/manage/batches/:id/files` | Admin/pemilik batch |
| `POST /quality/manage/admin/partners/:id/files` | Admin; PDF kerja sama internal |
| `GET /quality/manage/admin/agreements/:id/source` | Admin |
| `POST /quality/manage/reports` | Admin/pemilik batch; selalu menunggu pemeriksaan |
| `PATCH /quality/manage/reports/:id/review` | Admin |
| `GET /quality/manage/reports/:id/source[?download=1]` | Admin/pemilik; juga mempertahankan akses riwayat |

QR menggunakan `PUBLIC_APP_URL` atau konfigurasi `FRONTEND_URL`, dan locale dari `PUBLIC_DEFAULT_LOCALE` (`id`/`en`). Domain produksi tidak ditulis permanen. QR menuju kode batch yang benar, bukan ID yang ditafsirkan sebagai kode; QR bukan pengesahan digital ARC.

## Validasi yang benar-benar dijalankan

Pemeriksaan akhir selesai pada 27 Oktober 2026. Pengujian memakai fixture bertanda TEST FIXTURE/DEMONSTRATION; tidak ada laporan resmi ARC yang dibuat.

- Integrasi akhir PostgreSQL/HTTP: **14 skenario lulus**, termasuk pendaftaran batch → pemeriksaan → penetapan harga → publikasi, snapshot sumber QC lama, pengiriman ulang serentak, dan file preview/download dengan checksum sama. Log: `artifacts/quality-workflow-integration.log`.
- Unit backend: **21 suite / 40 tes lulus**, termasuk penolakan unggahan remote ketika bucket publik/tidak dapat dikonfirmasi privat, serta larangan menafsirkan satuan lain sebagai persentase. Storage remote diuji melalui mock API; koneksi bucket produksi tidak diuji. Log: `artifacts/quality-backend-unit.log`.
- Frontend: **12 suite / 27 tes lulus**, termasuk Bahasa Inggris, nilai nol, mitra dari respons API, status pending/demo, dan pemuatan ulang setelah pencabutan.
- Prisma schema validate: lulus. Generasi client awal menemui DLL Windows yang sedang dipakai server existing; pemeriksaan menggunakan DLL yang sama dengan metadata client baru, tanpa menghentikan server pengguna. Untuk generasi normal, jalankan `npx prisma generate` setelah server lama berhenti.
- Build backend dan pemeriksaan tipe kode produksi backend tanpa cache incremental: lulus. `tsc --noEmit` yang turut memeriksa seluruh tes legacy masih melaporkan masalah tipe existing pada `commerce.e2e-spec.ts` dan `supplier-verification.e2e-spec.ts`; masalah tersebut berada di luar perubahan alur mutu.
- Pemeriksaan tipe frontend: lulus.
- Build frontend dengan output terpisah `.next-pertamuda`: lulus. Build standar awal terhambat cache `.next` OneDrive dan akses font; output terpisah serta akses Google Fonts menyelesaikannya. Peringatan Tailwind/webpack existing tetap ada.
- Pemeriksaan browser dengan API/akun/schema fixture terisolasi: login pemasok dan admin, pengajuan lewat formulir menghasilkan “Saved” dan notifikasi, tambah mitra lewat formulir menghasilkan “Partner saved”, informasi hasil uji di halaman tujuan QR, laptop 1280 × 800 serta ponsel 390 × 844 dalam ukuran CSS, Bahasa Indonesia/Inggris. Viewport sementara dikembalikan setelah pemeriksaan.

Bukti tampilan (semua data fixture, bukan dokumen operasional):

- `artifacts/quality-supplier-mobile-id.jpg`
- `artifacts/quality-admin-partners-laptop-en.jpg`
- `artifacts/quality-public-batch-laptop-id.jpg`
- `artifacts/quality-public-batch-mobile-id.jpg`

Runner: dari direktori `backend`, jalankan `npm run test:quality` atau `node scripts/quality-workflow-test.cjs`. Runner membuat schema acak baru `quality_workflow_test_<12 hex>`, membangun schema sebelum migrasi, memasukkan sertifikat legacy fixture, menerapkan **SQL migrasi aktual**, menjalankan `test/quality-workflow.integration-spec.ts` dengan guard JWT sebenarnya (terpisah dari runner e2e legacy), lalu menghapus hanya schema baru tersebut. Tidak menjalankan reset database operasional. Opsi `--preview` membuka API fixture pada `127.0.0.1:3103` selama maksimal 10 menit untuk QA browser; kredensial sementara tersimpan di file ignored `.quality-preview.json` dan dibersihkan saat selesai. Frontend QA dapat dijalankan pada port 3102 dengan `NEXT_PUBLIC_API_URL=http://127.0.0.1:3103/api` serta `VALAM_FRONTEND_DIST=.next-quality-ui`.

## Informasi resmi yang masih dibutuhkan

Nama resmi lengkap selain label yang dikonfirmasi “ARC USK”, file/URL logo resmi, alamat pengiriman, kontak, jenis layanan rinci, prosedur, tarif, jumlah/kemasan sampel, waktu layanan, dan saluran resmi penyerahan hasil belum diisi. Dokumen kerja sama perlu diunggah admin bila tersedia; tidak dibuat dokumen kemitraan contoh. Tidak ada klaim akreditasi atau standar kelulusan tanpa bukti/sumber/versi. Belum ada laporan ARC nyata yang diunggah atau diperiksa dalam pekerjaan ini.

## Panduan pengujian manual

1. Terapkan migrasi tambahan pada lingkungan pengujian yang sesuai, generate Prisma Client, dan jalankan backend/frontend. Isi domain QR dari konfigurasi. Migrasi ini belum diterapkan ke schema operasional oleh pengerjaan ini.
2. Login admin → **Mitra Pengujian**. Periksa data ARC yang masih kosong. Tambahkan mitra pengujian lingkungan tes, isi layanan/instruksi yang benar-benar tersedia, atur izin, pilih aktif dan menerima pengajuan. Pastikan nama baru muncul tanpa mengubah komponen.
3. Login pemasok dengan profil yang memenuhi guard verifikasi existing → **Tambah Batch**. Daftarkan batch asli pemasok; pendaftaran belum menyatakan sampel dikirim.
4. Buka **Pengujian & Hasil** → pilih batch, mitra aktif, dan layanan → ajukan. Periksa nomor pengajuan, waktu, riwayat “Diajukan”, dan notifikasi. Untuk kolom layanan yang kosong, pastikan “Menunggu konfirmasi admin” muncul.
5. Login admin → **Pengujian/QC**. Catat “Menunggu pengiriman sampel” dengan catatan konfirmasi yang benar. Login pemasok → catat “Sampel dikirim”, informasi pengiriman, dan bukti jika ada.
6. Admin mencatat “Sampel diterima” dan kemudian “Dalam pengujian” berdasarkan konfirmasi mitra. Periksa notifikasi penerimaan. Coba lompatan status atau pemasok lain: server harus menolak.
7. Admin mengunggah dokumen asli dari saluran yang disepakati, mengisi penerbit, nomor, sampel, tanggal bila tercantum, parameter/metode, kesimpulan, sumber penerimaan, serta izin publikasi. Hubungkan ke pengajuan/batch yang benar. Dokumen masih menunggu pemeriksaan.
8. Buka sumber asli, periksa lima kelompok pemeriksaan, lalu setujui dengan catatan. Jika tidak sesuai, minta revisi/tolak dengan alasan. Persetujuan resmi menampilkan hasil pada pemasok dan memperbarui pengajuan; demo tidak memperoleh badge resmi.
9. Pemasok melihat notifikasi hasil, status pemeriksaan, metadata, parameter, kesimpulan, dan mengunduh file asli. Untuk batch baru, tetapkan harga melalui inventori agar produk masuk katalog. Preview dan download harus identik.
10. Pembeli membuka detail batch dan QR. Periksa nama penerbit snapshot, nomor/tanggal sebenarnya, parameter, dan sumber asli yang diizinkan. Status identitas pemasok tidak boleh diperlakukan sebagai hasil uji.
11. Uji jalur laporan sudah dimiliki: unggah laporan pada batch sendiri **tanpa memilih pengajuan**. Pastikan menunggu pemeriksaan dan tidak dibuat riwayat pengiriman/pengujian.
12. Uji penggantian dengan laporan baru, dan pencabutan oleh admin. Periksa bahwa riwayat tetap ada, badge/sumber publik mengikuti laporan terkini, file lama tetap privat bagi pemilik/admin, dan perubahan nama/status mitra tidak mengubah penerbit laporan lama.
13. Tutup penerimaan mitra/nonaktifkan mitra. Pengajuan baru harus ditolak; riwayat dan laporan terdahulu tetap tersedia. Ulangi kirim tindakan dengan kunci yang sama: tidak boleh menggandakan kejadian/notifikasi.

## Status pengerjaan

### Penyederhanaan navbar pemasok — 27 Oktober 2026

Navbar pemasok memakai kembali desain navbar semula: latar hijau, logo VALAM,
sudut membulat, serta efek mengambang saat scroll pada desktop. Satu-satunya
menu yang ditampilkan adalah **Dashboard Supplier**, berupa label visual statis
tanpa tautan, tombol, atau aksi, termasuk pada ponsel. Katalog, matching, chat,
insights, dan tautan dashboard/profil berulang disembunyikan dari navbar pemasok.
Pemilih bahasa, identitas akun, dan keluar akun tetap tersedia sebagai kontrol
akun. **Pengaturan Profil** berada di sidebar pemasok dan padanan menu
selulernya, bersama fitur pemasok lainnya. Offset layout/sidebar mengikuti
tinggi navbar semula: 64 px desktop dan 56 px ponsel.

Validasi: **5 tes navigasi pemasok lulus**, termasuk label statis ID/EN pada kedua
varian responsif, tautan profil di sidebar, penggantian bahasa pada route yang
sama, dan navigasi buyer yang tetap tersedia. Pemeriksaan tipe dan build
frontend lulus; log build: `artifacts/supplier-navbar-frontend-build.log`.
Browser menampilkan navbar hijau semula dengan satu label Dashboard Supplier;
DOM memastikan label tidak berada di dalam kontrol interaktif. Pada lebar CSS
390 px header tetap berada dalam lebar viewport dan menu fitur muncul pada
navigasi pemasok seluler. Bukti desktop: `artifacts/supplier-navbar-desktop.jpg`.

### Perbaikan navigasi admin — 27 Oktober 2026

Halaman Circular Products sebelumnya merender `AdminSidebar` tambahan di dalam
layout admin dan menggunakan `<main>` serta scroll layar penuh tersendiri.
Navigasi sekarang hanya dirender oleh layout utama. Lebar konten menggunakan
`min-w-0` agar tabel tidak mendorong sidebar keluar dari viewport.

Sidebar desktop/mobile memakai satu pohon navigasi. Latar penutup hanya ada saat
menu mobile terbuka; area klik menu minimal 44 px, tanpa transform saat ditekan.
Menu mendukung Escape, klik di luar panel, penutupan setelah memilih tautan atau
berganti route, pengembalian fokus, pembatasan Tab dalam panel, dan pemulihan
scroll lock sebelumnya. Bagian menu/akun dapat digulir pada layar pendek;
perpindahan ke breakpoint desktop menutup drawer dan membersihkan overlay.

Validasi: **7 tes regresi navigasi**, pemeriksaan tipe, dan build frontend lulus
(`artifacts/admin-sidebar-frontend-build.log`). Di browser diperiksa jumlah satu
sidebar/satu main pada Circular Products, perpindahan menu desktop/mobile,
area klik nyata sekitar 46 px, lebar CSS ponsel 390 px, layar pendek dengan menu
Pengaturan tetap dapat diklik, Bahasa Indonesia/Inggris, Escape, backdrop, dan
pemulihan setelah resize. Bukti: `artifacts/admin-sidebar-desktop-fixed.jpg`,
`artifacts/admin-sidebar-mobile-fixed.jpg`, dan
`artifacts/admin-sidebar-short-screen-fixed.jpg`.

### Perbaikan kartu pemasok — 27 Oktober 2026

Error `Cannot read properties of null (reading 'split')` pada
`SupplierProofSection` berasal dari asumsi bahwa seluruh pemasok memiliki
`nama_koperasi`. Petani/penyuling dapat mempunyai nilai tersebut `null`.
Kartu sekarang memakai helper nama pemasok existing (`nama_pic` untuk pemasok
perorangan), dengan tipe nama koperasi nullable dan pembentukan inisial yang
aman untuk nama kosong maupun spasi berlebih. Empat tes regresi terfokus dan
pemeriksaan tipe frontend lulus.

### Perbaikan startup demo — 27 Oktober 2026

Laporan `DATABASE_SCHEMA_MISMATCH` terjadi karena kode mutu baru sudah tersedia,
sedangkan schema demo `pertamuda_test` masih memakai struktur sebelumnya.
Ditambahkan `npm run demo:migrate:quality`, migrasi aditif dengan pemeriksaan
target schema, kunci transaksi, `IF NOT EXISTS`, pemeriksaan constraint, dan
pemeriksaan jumlah baris tabel lama. `demo:prepare` sekarang juga menjalankan
langkah mutu ini setelah persiapan Prisma berhasil; `demo:start` tetap tidak
mengubah database secara otomatis.

Migrasi telah diterapkan dan dijalankan ulang pada schema demo pengguna. Jumlah
baris di **25 tabel lama tetap sama**; tidak ada reset dan tidak ada migrasi
schema operasional. Startup dengan konfigurasi demo yang sama berhasil pada
port uji terpisah 3105. `GET /api/quality/partners` dan `GET /api/products`
mengembalikan **HTTP 200**; daftar mitra menampilkan ARC USK dengan penerimaan
pengajuan masih ditutup sesuai konfigurasi awal. Server smoke test dihentikan
setelah pemeriksaan. Tes terfokus: **12 tes guard/migrasi dan 5 tes pemeriksaan
schema lulus**. Peringatan konfigurasi sekarang menjelaskan bahwa layanan
NILA, pembayaran, dan pengiriman eksternal sengaja dinonaktifkan di mode demo.

Untuk melanjutkan pada database lokal yang sudah diperbarui ini, jalankan
`npm run demo:start` dari direktori `backend`. Untuk schema demo lain yang masih
lama, jalankan `npm run demo:migrate:quality` terlebih dahulu.

Frontend, backend, migrasi tambahan, pembatasan akses, riwayat, sumber asli, proyeksi publik, instruksi NILA, dan runner pengujian tersedia pada branch kerja. Tidak ada deployment produksi, akun laboratorium, migrasi/reset schema operasional, atau dokumen resmi yang direkayasa.
