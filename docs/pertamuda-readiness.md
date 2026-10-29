# Kesiapan demonstrasi Pertamuda

Tanggal pemeriksaan: 25–26 Oktober 2026 (Asia/Jakarta). Branch kerja:
`codex/pertamuda-readiness`, baseline `5f0dc53`, sama dengan `origin/main`
setelah `git fetch origin`. Working tree awal bersih. Tidak ditemukan AGENTS.md
di repository maupun direktori induk yang diperiksa. Tidak ada dependency diperbarui.

## Status tahapan

| Tahap | Status |
| --- | --- |
| 1. Pemeriksaan awal | Selesai. Build backend/frontend, 22 tes backend, 6 tes frontend, typecheck dan validasi Prisma lulus. Lint tetap gagal, lihat baseline. E2E awal gagal sebelum aplikasi siap. |
| 2. Data pengujian | Selesai: schema terisolasi, seed/reset dan tes integrasi idempotensi lulus. |
| 3. Autentikasi dan otorisasi | Selesai; 9 tes HTTP dengan database PostgreSQL terisolasi, 10 tes frontend, dan kedua build lulus. |
| 4. Kebenaran data produk | Selesai untuk pencatatan belum dievaluasi: 12 tes HTTP auth/QC, 14 tes frontend, typecheck dan kedua build lulus. Evaluasi laboratorium sungguhan belum tersedia. |
| 5. Pesanan, stok, pembayaran, wallet | Implementasi dan regresi otomatis selesai: 23 tes integrasi + 2 regresi terarah lulus, 24 tes unit backend, 14 frontend dan kedua build lulus. Gateway/pencairan bank belum diuji; batas operasional tercatat. |
| 6. RFQ ke pesanan | Selesai pada tes otomatis: 3 regresi RFQ + verifikasi ulang harga/asuransi snapshot lulus; build backend/frontend dan 24 tes unit backend lulus. Gateway sandbox tetap belum dijalankan. |
| 7. Matching dan sampel | Implementasi dan tes angka/alternatif/kontak lulus; build frontend dan tes HTTP lulus. |
| 8. NILA dan Eco | Selesai untuk batas kemampuan dan transparansi UI; 29 unit backend, 17 frontend, typecheck dan kedua build lulus. Model AI langsung belum diuji. |
| 9. Simulasi dan serah terima | Simulasi HTTP dan inspeksi browser dijalankan; panduan demo tersedia. Hasil pemeriksaan terakhir dan batas integrasi di bawah. Pembayaran interaktif sandbox masih menunggu konfigurasi. |

## Hasil akhir pemeriksaan penutup

- **Lulus:** 29/29 tes integrasi API/bisnis pada PostgreSQL pertamuda_test (3 suite; 81,668 detik), 33 unit backend, 22 unit frontend (termasuk review supplier), 10 guard lingkungan, dan 1 tes integrasi seed/reset penutup (22,5 detik).
- Build backend dan frontend, typecheck, serta git diff --check lulus. Build frontend demo memakai output terpisah .next-pertamuda agar tidak bertabrakan dengan server dev yang sedang memakai .next.
- **Lint belum lulus:** backend 1717 error/137 warning; frontend 401 error/43 warning. Tidak mematikan aturan lint untuk meloloskan pemeriksaan.
- **Belum siap diklaim demo transaksi interaktif penuh:** gateway sandbox ditunda atas arahan pengguna; rekening/identitas supplier baseline belum lengkap, QC belum dievaluasi, transfer bank/refund keluar belum terintegrasi penuh. Batas ini bukan pengujian yang berhasil.

## Struktur dan cara menjalankan

- `frontend/`: Next.js 14 App Router, React, next-intl, locale `id`/`en`.
  `npm ci`, `npm run dev` (port 3000), `npm run build`, `npm start`.
- `backend/`: NestJS 11, Prisma 6, JWT lokal, integrasi Supabase,
  Midtrans Snap, Biteship, dan xAI. `npm ci`, `npx prisma generate`,
  `npm run start:dev` (port 3001; prefix `/api`, Swagger `/api/docs`).
  Produksi build: `npm run build`, `npm run start:prod`.
- Database: PostgreSQL. Model aplikasi ada di `backend/prisma/schema.prisma`.
  Migration Prisma yang tersimpan hanya menambahkan field alamat; belum merupakan
  baseline lengkap untuk membangun database kosong. `supabase/migrations/`
  juga berisi schema Insights, seed katalog, newsletter, RLS, dan RPC.
  Jangan mengasumsikan dua rangkaian migration tersebut sinkron.
- `scripts/`: pembaruan harga dan SQL Supabase. Terdapat script ad hoc
  `backend/clean_*`, `fix_db*`, `migrate.sql`, dan seed lama; tidak dijalankan
  karena cakupan database/keamanannya belum dibatasi untuk testing.
- Runtime yang dipakai: Node 24.13.1, npm 11.21.1, dependency lokal sudah tersedia.
  Docker CLI tersedia tetapi daemon belum berjalan. Tidak ditemukan CLI psql.

## Konfigurasi (nama variabel saja)

Nilai `.env` tidak dicatat. `backend/.env` menunjuk database remote tanpa schema
testing khusus. Pengguna menyetujui pembuatan `pertamuda_test`, bukan pengubahan
data pada schema operasional. Flag sandbox eksplisit dan JWT_SECRET belum ada
di file tersebut; fallback kode bukan bukti konfigurasi siap.

| Area | Nama environment variable |
| --- | --- |
| Backend/database | `DATABASE_URL`, `DIRECT_URL`, `PORT`, `JWT_SECRET` |
| Backend/Supabase | `SUPABASE_URL`, `SUPABASE_KEY` |
| Backend/pembayaran | `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION` |
| Backend/pengiriman | `BITESHIP_API_KEY`, `BITESHIP_BASE_URL`, `BITESHIP_ENV`, `BITESHIP_WEBHOOK_SIGNATURE_KEY`, `BITESHIP_WEBHOOK_TOKEN` |
| Parameter pengiriman yang tercantum di .env.example | `SHIPMENT_BATAS_BERAT_OTOMATIS`, `SHIPMENT_MIN_BERAT_DOMESTIK`, `SHIPMENT_TARIF_ASURANSI`, `SHIPMENT_BIAYA_PENGEMASAN_DRUM` (pemakaian runtime perlu diverifikasi; jangan menganggap otomatis diterapkan) |
| NILA | `GROK_API_KEY`, `GROK_MODEL` |
| Backend URL pada kode | `BACKEND_URL` |
| Frontend | `PERTAMUDA_FRONTEND_BUILD` (opsional, output build demo terpisah), `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`, `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` |

Kunci server tidak boleh ditempatkan pada variabel NEXT_PUBLIC.
Untuk demo gunakan sandbox secara eksplisit di kedua sisi. Kredensial sandbox
belum dibuktikan dengan panggilan gateway; tidak ada pembayaran dilakukan.

## Baseline sebelum perubahan kode

| Pemeriksaan yang benar-benar dijalankan | Hasil awal |
| --- | --- |
| Backend `npm run build` | Lulus |
| Backend `npm test -- --runInBand` | 16 suite / 22 tes lulus; sebagian besar hanya `should be defined`, bukan bukti integritas bisnis |
| Backend ESLint tanpa `--fix` | 1.307 error, 89 warning; 666 masalah formatting, banyak akses data tanpa tipe |
| Frontend `npm run build` | Gagal EPERM membuat subdirektori `.next`; konfigurasi awal melewati lint dan tipe |
| Frontend `npm run lint` | 432 error, 44 warning |
| Frontend `npm test -- --runInBand` | 1 suite gagal parse ESM next-intl; 1 suite / 3 tes lulus |
| Frontend `tsc --noEmit` | Gagal TS7053 di PriceSection, indeks grade bertipe any |
| Prisma `validate` dengan URL lokal dummy | Lulus; hanya validasi schema, tidak membuka koneksi |
| Backend `test:e2e -- --runInBand`, seluruh integrasi diarahkan ke localhost/dinonaktifkan | Gagal koneksi PostgreSQL 127.0.0.1:5432. Tes bawaan masih mengharapkan GET / = Hello World, sementara AppModule tidak punya root controller; perlu diganti dengan skenario API nyata pada tahap pengujian terkait. |
| `docker info` | Gagal: daemon Docker tidak tersedia |

Detail lint tanpa source code/kredensial ada di
`artifacts/pertamuda-backend-lint-baseline.json` dan
`artifacts/pertamuda-frontend-lint-baseline.json`.
Lint backend sengaja dipanggil tanpa `--fix` agar baseline tidak mengubah file.
Tidak ada migrasi, reset, seed lama, pembayaran, atau panggilan pengiriman dilakukan.

## Peta alur dan risiko yang telah diverifikasi pada kode baseline

| Alur | Jalur kode utama dan endpoint | Temuan awal; belum diperbaiki kecuali dinyatakan pada progres |
| --- | --- | --- |
| Katalog | frontend marketplace, katalog/[id], marketplace/product/[id]; ProductsController GET products, GET products/:id | Beberapa jalur detail memakai mock saat API gagal; klaim verifikasi tergantung status string; public response perlu audit data pribadi. |
| QC | QcController POST admin/qc/:batchId, PATCH .../receive; QcService; Product, QcResult, Certificate, TraceLog | Endpoint tulis tanpa guard; admin contoh/diganti user lain; hasil otomatis pass dan sertifikat otomatis terbit tanpa aturan evaluasi. |
| Matching | POST matching; MatchingService; halaman matching dan dashboard/buyer/matching | Jarak Euclidean ke solusi ideal berbobot PA .40, harga .30, air .15, volume .15, dengan penalti pelanggaran; alternatif dan hasil memenuhi batas belum dipisahkan. Nilai QC kosong menjadi nol. |
| RFQ | POST rfq, PUT rfq/:id/respond, PUT rfq/:id/close; RfqRequest/RfqResponse | Penawaran tidak menyimpan batch/expiry; acceptance memakai produk pertama supplier atau membuat produk VERIFIED; pengurangan stok dan penciptaan order tanpa transaksi/idempotensi. |
| Checkout | CartController, POST orders/checkout; OrdersService | Checkout cek stok tetapi pembayaran mengurangi stok belakangan; jalur RFQ berbeda; perlu reservasi atomik yang sama. |
| Pembayaran | PaymentService; POST payment/notification, GET payment/status/:orderId, PUT orders/:id/retry-payment | Verifikasi signature bersyarat: signature kosong bisa lewat; nominal tidak dibandingkan dengan transaksi; guard status tidak membatasi pemilik order; sequential duplicate check belum menjamin keamanan konkurensi. |
| Pengiriman | ShipmentService/BiteshipService; quote, confirm-ongkir, pickup, confirm-received, webhook | Jalur penerimaan berbeda dari OrdersService.completeOrder; seluruh jalur penyelesaian/refund harus diaudit bersama. |
| Wallet | WalletService; OrdersService.addFundsToWallet; ShipmentService | Supplier dapat COMPLETED lewat unggah bukti lalu wallet dikreditkan; completeOrder buyer tanpa validasi status; kredit tidak punya unique reference dan tidak atomik; withdrawal cek lalu decrement terpisah. |
| Auth/admin | AuthService/JwtStrategy, RolesGuard, AdminController, frontend AuthProvider/login | Fallback secret JWT; registrasi perlu audit role admin; AdminController tanpa guard; frontend login punya mock_token saat request gagal. |
| NILA/Eco/sampel | chat.constants.ts, NilaChatWidget, detail produk dan RFQ | Prompt menjanjikan escrow/QC independen; beberapa kontak WhatsApp masih contoh; Eco Score memiliki nilai fallback. |

Status dalam tabel ini adalah hasil inspeksi kode, bukan klaim eksploitasi dijalankan
terhadap database remote. Perbaikan bisnis akan dilakukan berurutan bersama tes regresi.

## Progres Tahap 1

- Menambahkan `frontend npm run typecheck`, memperbaiki tipe indeks grade,
  dan mengaktifkan pemeriksaan tipe pada `next build`.
- Memperbaiki harness ProductCard dengan mock konteks navigasi/locale/auth hanya
  di tes; assertion badge disesuaikan dengan teks komponen yang sekarang.
  Ini tidak membuat atau mengizinkan bypass autentikasi di aplikasi.
- Lint global tetap utang awal; tidak mematikan aturan atau melakukan reformat besar.
- Verifikasi ulang: frontend 2 suite / 6 tes lulus, typecheck lulus, build
  production lulus dengan pemeriksaan tipe aktif. Build perlu dijalankan di luar
  sandbox karena EPERM direktori `.next`. Ada warning cache webpack next-intl
  dan utilitas Tailwind ambigu; bukan bukti kegagalan transaksi. Lint tetap
  terpisah dan belum lulus; build masih melewati lint sesuai konfigurasi awal.

## Pekerjaan berikutnya

Selesaikan verifikasi Tahap 1, siapkan schema dan seed/reset yang hanya menerima
lingkungan testing terisolasi (Tahap 2), baru lanjutkan otorisasi API (Tahap 3).
Tahap 4–9 wajib menyertakan tes bisnis, termasuk konkurensi stok/wallet,
webhook tidak sah/berulang, refund terkonfirmasi, RFQ satu order,
expired session, kegagalan API, dan pemeriksaan laptop/ponsel.

## Lingkungan demonstrasi terisolasi

Jalankan perintah berikut dari `backend/`. Script membaca backend/.env tanpa
mengubahnya, memaksa DATABASE_URL dan DIRECT_URL ke schema `pertamuda_test`,
NODE_ENV=test dan flag sandbox. Schema `public` tidak menjadi target.

```powershell
npm run demo:test:guard
npm run demo:prepare
npm run demo:seed
npm run demo:test:data
npm run demo:start
```

- `demo:prepare` menggunakan Prisma db push tanpa accept-data-loss/reset.
  Hanya digunakan untuk schema testing ini; bukan prosedur migrasi produksi.
- `demo:seed` membuat akun buyer/supplier/admin berlabel DEMONSTRASI, memakai
  password acak yang di-hash bcrypt. Kredensial tersimpan lokal pada
  `backend/.pertamuda-credentials.json`, diabaikan Git; jangan dibagikan/log.
- Batch `DEMO-PERTAMUDA-001`: 500 kg, MOQ 10 kg, harga demonstrasi Rp850.000/kg.
  Batch `002`: 100 kg, MOQ 5 kg, Rp780.000/kg. Batch `HABIS`: 0 kg,
  MOQ 5 kg, Rp680.000/kg. Asal berlabel Desa DEMONSTRASI, Aceh Barat, Aceh.
- Informasi mutu awal: belum diuji/belum dievaluasi. Tidak ada hasil QC,
  sertifikat, identitas pemasok, nomor kontak, atau rekening bank rekaan.
  Produk sengaja DRAFT sampai ada proses evaluasi yang benar; katalog dan
  perjalanan transaksi belum siap hanya karena seed tersedia.
- Seed memakai upsert dan advisory lock; seed ulang tidak memulihkan stok yang
  sudah berubah. `demo:reset` menghapus data **seluruh schema pertamuda_test**
  lalu membuat baseline dalam transaksi; hentikan aplikasi/test lain sebelum
  reset. Tidak DROP/TRUNCATE dan tidak menghapus schema lain.
- `demo:test:data` benar-benar menjalankan seed berulang, perubahan stok uji,
  reset, cek password/peran, dan cek tidak adanya QC/sertifikat. Perintah ini
  juga mereset seluruh data schema testing; bukan pemeriksaan read-only.
- Gateway pembayaran, Biteship, Supabase eksternal dan NILA dinonaktifkan pada
  runner ini. Flag sandbox saja tidak membuktikan sebuah kunci adalah sandbox.
  Belum ada tes pembayaran/pengiriman nyata atau sandbox dijalankan.
- `demo:start` memakai JWT secret acak per proses kecuali
  `PERTAMUDA_JWT_SECRET` disediakan. Login ulang setelah restart jika memakai
  secret acak. Jangan menjalankan backend biasa ke public untuk demonstrasi.

Untuk mengembalikan baseline:

```powershell
# Hentikan demo:start terlebih dahulu
npm run demo:reset
```

Tes pencegah konfigurasi berbahaya: 9 tes lulus. Koneksi database read-only
lulus dan schema testing berhasil dibuat dengan akses jaringan di luar sandbox.
Tes integrasi seed/reset lulus (30 detik); baseline setelah reset berisi 3 akun,
3 batch DRAFT dan saldo wallet nol.

## Progres Tahap 3

- Registrasi publik hanya buyer/supplier, tidak bisa membuat admin. Login menolak
  akun rejected/suspended; pending tetap dapat onboarding sesuai alur pendaftaran.
- JWT_SECRET wajib minimal 32 karakter, tanpa fallback secret yang diketahui.
  Ditambahkan AuthSession serta migration additive; diterapkan hanya ke schema
  testing. Token lama tanpa session id harus login ulang. Token expired, sesi
  dicabut/expired, dan perubahan role/status akun dicek kembali di backend.
- POST `/api/auth/logout` mencabut sesi server. Frontend membersihkan sesi lokal,
  memanggil logout server, memeriksa expiry dan membersihkan sesi saat API
  mengembalikan 401 pada validasi profil. Jika jaringan putus saat logout,
  pencabutan server belum terkonfirmasi; token server tetap tunduk pada expiry.
- Login frontend tidak lagi menyimpulkan role dari email/password atau membuat
  mock token ketika API gagal. Dashboard hanya dirender untuk role yang sesuai.
- RolesGuard membaca metadata handler **dan controller**; admin/QC/users
  dilindungi JWT/role. Identitas admin QC berasal dari sesi, tidak memilih admin
  lain atau user pertama. Status pembayaran hanya bisa dibaca pemilik buyer.
- Respons order/RFQ/shipment/traceability/circular/public supplier memilih field
  pengguna publik; tidak mengirim password, NIK atau rekening. Dokumen lokal
  memerlukan kepemilikan/admin dan validasi path. Static upload dibatasi ke
  gambar batch/circular, tidak menyajikan dokumen identitas.
- Draft produk tidak tersedia dari katalog/detail publik; supplier menggunakan
  endpoint `/products/mine` dengan scope dari token, admin memakai
  `/admin/qc/products`. Query supplier_id tidak dapat mengganti scope pemilik.
- Backend build + 22 tes unit lulus; frontend typecheck + 9 tes unit lulus
  sebelum penambahan tes kegagalan login. Tes HTTP nyata lulus: kredensial salah,
  admin signup ditolak, akses tanpa token, role lintas dashboard/admin/QC,
  kepemilikan status pembayaran/draft inventory, respons tanpa data sensitif,
  expiry JWT/sesi, role/status dari database, logout dan replay token.
- Percobaan `prisma generate` gagal EPERM saat mengganti DLL yang sedang
  terkunci Windows, termasuk di luar sandbox. File client/model sudah diperbarui
  dan build serta 9 tes HTTP dengan model sesi berhasil dijalankan menggunakan
  engine versi yang sama. Perintah generate penuh kemudian berhasil pada Tahap 6; kendala EPERM ini merupakan riwayat awal, bukan status terakhir.
- Belum dilakukan pengujian browser/login visual atau audit izin bucket Supabase
  eksternal. Perubahan auth membutuhkan migration sesi sebelum deploy; belum deploy.

## Progres Tahap 4

- Hasil pengujian boleh kosong (null), nol tetap nol. Ditambahkan metadata
  laboratorium, nomor laporan, tanggal uji, dokumen sumber, dan versi evaluasi.
  Pencatatan bersifat atomik dan selalu UNEVALUATED; tidak menerbitkan sertifikat,
  tidak mengganti identitas admin, tidak menciptakan trace event lulus lab.
- Dasar evaluasi belum tersedia, sehingga tidak mengadopsi batas contoh UI lama.
  Aturan validasi bentuk data dan batas kemampuan dijelaskan pada
  `docs/qc-evaluation.md`. Identitas pemasok terpisah dari mutu batch.
- Tampilan CoA memakai catatan hasil, bukan kop lab/akreditasi/tanda tangan
  rekaan. Preview buyer dan supplier tidak lagi membuat CoA fallback; download
  sertifikat lama tanpa provenance evaluasi ditolak.
- Detail produk lama diarahkan ke katalog yang sama. Nilai uji cadangan,
  rating/penjualan contoh, dan fallback data lokal di katalog/profil supplier
  dihapus atau diberi kondisi belum tersedia. Klaim metode umum dilabeli contoh,
  bukan pembuktian metode/akreditasi batch.
- Harga batch membedakan penawaran dan DEMONSTRATION, fixture berlabel is_demo.
  Harga Insights ditampilkan indikatif. Harga cadangan tidak lagi disintesis
  saat sumber kosong/gagal; tanggal kosong tidak diganti dengan hari ini.
- API katalog/profil/QC yang gagal tidak menghasilkan data contoh atau
  pemberitahuan simpan berhasil. Produk lama berstatus VERIFIED tidak otomatis
  mendapat badge lab; API mengembalikan quality_status=UNEVALUATED.
- Tes HTTP baru benar-benar menguji hasil kosong, nol, metadata, penolakan
  status pass/admin palsu, parameter tidak valid, dan ketiadaan sertifikat.
  Tes frontend memeriksa nilai nol, ketiadaan tanda tangan/PASS, dan harga tanpa
  data/tanggal rekaan. Total 12 tes HTTP dan 14 tes frontend lulus.
- Run HTTP pertama gagal 4 timeout pada batas default 5 detik; pengulangan
  dengan batas 30 detik untuk PostgreSQL remote lulus. Bukan perubahan assertion
  atau pengabaian tes. Build menangkap import sebelum direktif use client pada
  dua halaman order; posisi direktif diperbaiki dan build ulang lulus.
- Tidak ada aturan kelulusan laboratorium/accreditation yang diklaim siap,
  dan belum ada pengujian visual pada tahap ini.

## Batas pengujian gateway

Kunci Midtrans dari backend/.env tidak teridentifikasi sebagai kunci sandbox;
secret webhook Biteship belum tersedia. Pengguna menginstruksikan melanjutkan
tes otomatis tanpa gateway dan menunda pengujian sandbox. Kredensial tersebut
tidak dipakai untuk request pembayaran. Tes transaksi berikutnya harus memakai
gateway tiruan pada batas transport sambil mempertahankan verifikasi signature,
nominal, kepemilikan dan aturan bisnis aplikasi.

## Progres Tahap 5

- Ditambahkan CommerceService untuk reservasi, transisi supplier, penerimaan
  buyer, expiry dan kredit wallet. Kedua endpoint penerimaan memakai aturan yang
  sama. Supplier tidak bisa COMPLETED lewat unggah bukti.
- Reservasi/stock/item/order atomik, webhook/receipt dilindungi lock per order,
  ledger kredit/refund dan key checkout/withdrawal memiliki indeks unik.
  Penarikan bersamaan tidak dapat melebihi saldo; penarikan adalah PENDING,
  bukan klaim transfer bank.
- Webhook signature wajib, nominal/referensi diperiksa, lalu status otoritatif
  gateway dibaca. Tidak ada suffix fallback atau bypass secret kosong. Biteship
  tidak lagi melewati autentikasi pada mode sandbox.
- Refund request terpisah dari konfirmasi gateway; partial refund dan pembayaran
  terlambat masuk status pemeriksaan. Refund sesudah kredit wallet membalik saldo
  tersedia sekali, mencatat kekurangan dan membekukan withdrawal.
- Stok published/reserved tidak dapat ditimpa lewat edit inventori. Delete
  batch ber-order tidak menghapus bukti. Reset order API ditolak.
- Buyer/supplier/wallet tidak menyimulasikan perubahan transaksi saat API gagal;
  instruksi rekening bank contoh dihapus. Klaim escrow pihak ketiga diganti
  keterangan pembayaran gateway dan ledger internal.
- Run pertama regresi: 19/21 lulus, replay checkout dan expiry gagal. Setelah
  pemeriksaan/perbaikan: 21/21 lulus. Dengan tambahan refund sesudah kredit dan
  penolakan reset: 23/23 lulus. Regresi edit stok terarah: 1 lulus, 11 tes lain
  sengaja tidak dijalankan pada run terarah itu. Tes webhook pengiriman dan
  autentikasi Biteship kemudian lulus (lihat pemeriksaan akhir).
- Backend build/22 tes unit lulus sebelum tambahan tes Biteship. Frontend
  typecheck/14 tes unit/build lulus; pemeriksaan akhir setelah perubahan terakhir
  masih berlangsung. Belum mengklaim simulasi browser atau gateway sandbox.
- Aturan dan batas layanan dijelaskan di `docs/transaction-state.md`.
  Prisma db push berhenti pada warning indeks unik; tidak memakai
  accept-data-loss. Migration additive dijalankan dalam transaksi hanya pada
  pertamuda_test, lalu schema diverifikasi sinkron. Tidak ada ledger dihapus.

## Progres Tahap 6

- Respons pemasok menyimpan product_id eksplisit, harga/volume dan expires_at.
  Tidak ada fallback produk pertama atau pembuatan batch VERIFIED otomatis.
- Status OFFERED/COUNTER_OFFER menunggu buyer; acceptance, reservasi melalui
  CommerceService, OrderItem snapshot, payment pending dan RFQ ACCEPTED atomik.
  Lock RFQ dan relasi order unik mencegah order ganda ketika klik bersamaan.
- Penawaran tanpa batch/expiry (termasuk data lama), salah kepemilikan, MOQ/stok
  tidak cukup dan expiry ditolak. Penolakan tidak membuat order atau mengubah stok.
- Buyer mengonfirmasi tarif server, lalu pembayaran menggunakan snapshot harga
  RFQ. Nilai asuransi memakai nilai kesepakatan, bukan harga katalog terbaru.
  Biaya/alamat dikunci saat payment attempt disiapkan.
- Payload frontend diselaraskan dengan DTO backend; pemasok memilih batch/expiry,
  buyer menerima menjadi order dan melanjutkan melalui daftar pesanan. Nomor
  WhatsApp contoh dan pesan admin/verifikasi dokumen contoh RFQ dihapus.
- 3 regresi RFQ pada PostgreSQL lulus (13 tes lain sengaja tidak dijalankan pada
  run terarah), termasuk counter-offer, acceptance paralel, expiry, stok habis,
  penolakan dan injeksi harga. Verifikasi ulang snapshot harga/asuransi lulus.
- Unit RFQ awal gagal karena dependency CommerceService belum dimock dan status
  lama ACCEPTED tidak lagi menyatakan penerimaan buyer; harness disesuaikan,
  pemeriksaan kepemilikan dipertahankan. Seluruh 24 tes unit backend kemudian lulus.
- Kedua build lulus. `prisma generate` juga akhirnya berhasil penuh pada tahap
  ini; kendala DLL Windows sebelumnya tidak lagi terjadi pada run tersebut.
- RFQ saat ini memakai IDR dan pengiriman domestik yang dikonfirmasi server;
  payment sandbox dan proses ekspor/L/C operasional belum diuji.

## Progres Tahap 7

- Kelayakan seluruh batas dipisahkan dari pemeringkatan relatif. API/UI memisah
  matches dan alternatives serta memberikan alasan, termasuk data hilang/MOQ.
- Tidak ada nilai QC nol/skor cadangan saat data kosong. Tidak ada algoritma
  frontend kedua atau mock supplier saat matching API gagal. Skor hash rekaan
  pada kartu katalog dihapus dan query URL tidak menjadi bukti skor batch.
- Algoritma dan bobot internal dijelaskan di `docs/matching.md`; tidak disebut
  TOPSIS, standar industri atau probabilitas akurasi.
- Tombol sampel memakai kontak dari batch serta kode/tautan batch; tanpa kontak
  ditampilkan belum tersedia. Tidak mengklaim permintaan telah disimpan/dikirim.
  Nomor WhatsApp contoh dan alamat lab contoh untuk pengiriman supplier dihapus.
- Backend build + 27 tes unit lulus; frontend typecheck + 17 tes unit lulus.
  Tes baru membuktikan alternatif skor tinggi tidak menggeser hasil layak,
  moisture nol vs kosong, seluruh alasan kegagalan, dan tautan sampel tanpa kontak
  cadangan. Build frontend lulus setelah cache .next yang rusak pada OneDrive dibersihkan; tes HTTP validasi matching juga lulus.

## Progres Tahap 8

- NILA hanya memberi panduan umum tanpa akses database atau alat pencarian. Prompt dan kedua UI menjelaskan batas akses serta sumber yang harus diperiksa pengguna. Tidak ada data akun yang ditambahkan ke konteks.
- Tes dengan transport AI tiruan memeriksa batas prompt/no tools dan kegagalan tanpa key. Ini bukan bukti kepatuhan jawaban model langsung. Layanan xAI tidak dipanggil.
- Eco dijelaskan sebagai listing pemasok. Angka residu/CO2 turunan stok, bintang Eco bawaan, klaim 100% pengolahan, dan manfaat antiseptik tanpa dokumen dihapus. Profil supplier tidak lagi menampilkan sertifikat, QR, ulasan dan riwayat transaksi contoh sebagai fakta.
- Build backend/frontend, typecheck dan 29 unit backend/17 frontend lulus. Peringatan Tailwind lama masih ada.

## Progres Tahap 9 dan serah terima

### Pemeriksaan yang benar-benar dijalankan

- Build backend dan 29 tes unit (18 suite) lulus; guard lingkungan 10/10 lulus.
- Frontend: 19 tes unit (9 suite), typecheck, dan build produksi akhir lulus. Lint tetap gagal: backend 1717 error/137 warning; frontend 401 error/43 warning pada pemeriksaan penutup. Hasil final lint tersimpan di artifacts dan diperbarui saat pemeriksaan penutup. Build tidak dipakai sebagai bukti lint lulus.
- Seed/reset integrasi penutup lulus 1/1 (22,5 detik), memeriksa role/hash akun, seed berulang tidak menduplikasi data atau memulihkan stok aktif, lalu reset mengembalikan 3 akun/3 batch DRAFT, stok 500/100/0, wallet nol, tanpa order/QC/sertifikat. Sesi demo UI dibuat setelah run itu; reset penutup dijalankan sesudah regresi terakhir.
- Run integrasi lengkap mengalami timeout: 28/29 lalu 24/29; run berikutnya juga gagal ketika koneksi remote terputus (P1001/P2024/connection reset). Dengan koneksi sesi dan pool kecil, run lengkap mencapai 28/29; satu RFQ masih memakai budget eksplisit 60 detik. Ini bukan bukti assertion bisnis lulus pada run yang gagal.
- Tes stok yang timeout pernah lulus ulang tanpa perubahan assertion (9,2 detik). RFQ setelah penyamaan budget skenario 90 detik lulus ulang 1/1 (14,6 detik; 15 tes lain tidak dijalankan pada run terarah itu). Transaksi aplikasi tetap dibatasi 30 detik, assertion bisnis tetap sama. Run serah terima lengkap dicatat di artifacts/pertamuda-handoff-e2e.log.
- Runner sekarang memakai DIRECT_URL yang sudah disediakan, diturunkan ke schema pertamuda_test untuk kedua URL, pool tiga koneksi. Tidak menulis ulang .env. Pilihan koneksi dan pool kecil merujuk dokumentasi Supabase: https://supabase.com/docs/guides/database/connecting-to-postgres dan https://supabase.com/docs/guides/database/prisma/prisma-troubleshooting . Ini mengurangi jejak koneksi; bukan jaminan ketersediaan jaringan remote.
- Harness tes menghentikan timer/cron setelah inisialisasi, agar tidak berlomba dengan cleanup fixture atau hidup setelah app.close(). Perilaku expiry tetap dipanggil dan diuji secara eksplisit. Timer aplikasi normal tidak dimatikan.

### Inspeksi browser

- Aplikasi lokal diuji melalui browser pada viewport laptop 1366×768 dan ponsel 390×844. Halaman utama, katalog gagal API, login dan batas kemampuan NILA diperiksa; ukuran konten pada halaman publik yang diukur tidak melebihi viewport. Ini bukan bukti seluruh halaman/modals sudah diuji pada semua perangkat.
- Katalog saat API mati menampilkan kegagalan tanpa produk cadangan. Login saat API mati menampilkan Login Gagal dan tidak membuka dashboard.
- Login buyer, supplier dan admin memakai akun demo yang sama dengan database; ketiganya berhasil. Logout buyer/supplier kembali ke login. Pencabutan/replay token dibuktikan oleh tes HTTP, bukan hanya perubahan URL browser.
- Supplier dashboard menampilkan profil belum lengkap dan tidak mengizinkan tambah batch. Wallet menampilkan Rp0 dari server dan rekening belum terhubung. Admin menampilkan tiga batch DRAFT pada ringkasan. Pemuatan QC berikutnya mengalami koneksi database remote gagal; tidak dinyatakan berhasil memuat seluruh antrian pada run itu.
- Inspeksi menemukan inventori berhenti sebelum membaca /products/mine jika profil belum ada. Ketergantungan itu dihapus; backend tetap menegakkan role/pemilik dan verifikasi untuk penulisan. Dua regresi UI baru lulus: batch milik token dapat dibaca tanpa profil identitas, tanggal memakai data server, dan kegagalan API tetap terlihat. Inspeksi ulang browser setelah build terisolasi berhasil: ketiga batch DRAFT tampil pada laptop dan ponsel, stok 500/100/0 kg dan harga sesuai seed. Tanggal berasal dari created_at server. Tabel ponsel menggulir horizontal di dalam kontainernya, tanpa luapan halaman.
- Tanggal inventori/QC dan volume sampel statis dihapus. Tanggal yang tidak tersedia tidak diganti hari ini. Saldo/permintaan penarikan tidak dilabel transfer bank 1–2 hari.
- Halaman utama diperiksa ulang: statistik tanpa sumber dan testimoni pelanggan contoh dihapus; konten/harga contoh Insights diberi label DEMO; klaim akreditasi, GPS lengkap, dan escrow pada FAQ diganti penjelasan mekanisme aktual. Link katalog berlocale ganda diperbaiki. Checkpoint pengiriman contoh dan fallback sukses pengiriman lokal dihapus.

### Siap diuji dan pekerjaan yang tetap terbuka

| Area | Bukti/kondisi saat serah terima |
| --- | --- |
| Autentikasi/otorisasi | Login browser tiga peran dan tes HTTP role, kepemilikan, expiry, logout/replay tersedia. |
| Data demo | Seed/reset terjaga, idempotent, data jelas DEMONSTRASI. Profil identitas, kontak, rekening, hasil uji dan sertifikat tidak direkayasa. |
| Produk/QC | Pencatatan null/zero/provenance dan status belum dievaluasi diuji; kelulusan QC sungguhan belum tersedia karena dasar aturan belum diberikan. |
| Stok/pembayaran/wallet | Regresi memakai PostgreSQL nyata dan transport gateway tiruan. Tidak ada pembayaran atau transfer bank nyata. |
| RFQ/matching/sampel | Batch/harga/volume/expiry disimpan; penerimaan berulang/reservasi/snapshot diuji; matching memisahkan alternatif. Sampel hanya menautkan kontak jika ada. |
| NILA/Eco | Batas kemampuan terlihat. LLM langsung, akses data batch oleh NILA, dan angka dampak Eco terverifikasi belum tersedia/diuji. |
| Gateway/pengiriman | Midtrans sandbox ditunda atas arahan pengguna; secret webhook Biteship belum tersedia. Retry eksternal pickup saat timeout/concurrency perlu bukti provider sandbox; tidak diklaim idempotent lintas provider. |
| Refund/penarikan | Request berbeda dari konfirmasi. Transfer penarikan dan pengajuan refund keluar belum terintegrasi otomatis; partial refund dan shortfall perlu rekonsiliasi operasional. |
| Demo interaktif penuh | Belum dinyatakan siap: baseline batch masih DRAFT, profil supplier belum lengkap, gateway dinonaktifkan. Jangan bypass proses verifikasi untuk presentasi. |
| Kualitas kode/operasi | Lint masih gagal; koneksi remote pernah tidak stabil. Migrasi produksi, audit bucket eksternal, ekspor/L/C dan seluruh breakpoint/modal belum dijalankan. |

Panduan singkat dan reset: [pertamuda-demo-guide.md](pertamuda-demo-guide.md).
Aturan transaksi: [transaction-state.md](transaction-state.md); QC: [qc-evaluation.md](qc-evaluation.md); matching: [matching.md](matching.md).
Perubahan belum dipush atau dideploy. Database operasional/public tidak dimigrasi atau direset, .env pengguna tidak diubah, dan tidak ada pembayaran nyata.

### Penutupan regresi dan isolasi build

Run lengkap terakhir **29/29 lulus dalam 81,668 detik**, disusul seed/reset integrasi **1/1 lulus dalam 22,5 detik**. Log: artifacts/pertamuda-handoff-e2e.log dan artifacts/pertamuda-final-data-reset.log. Kegagalan sebelumnya tetap dicatat untuk menunjukkan ketidakstabilan koneksi remote yang pernah terjadi. Tidak mengganti assertion bisnis dengan skip.

Server hasil build sempat kehilangan module route pada .next ketika proses frontend lain juga berjalan. Output demo kini dipisahkan melalui PERTAMUDA_FRONTEND_BUILD=true ke .next-pertamuda (diabaikan Git); tsconfig menyertakan tipe output tersebut. Build terisolasi lulus. Gunakan flag yang sama saat build dan start. Server dev milik pengguna tidak dihentikan.

Inspeksi penutup memakai frontend localhost:3010 dan API localhost:3011 agar port server pengguna tidak dipakai. Perbaikan inventori terlihat pada browser di kedua ukuran. Bukti: artifacts/pertamuda-supplier-inventory.jpg dan artifacts/pertamuda-supplier-inventory-mobile.jpg. Server pengujian dan tab milik tugas ini dihentikan setelah inspeksi, lalu demo:reset dijalankan kembali untuk menghapus sesi inspeksi dan memulihkan baseline. Proses frontend milik pengguna tidak dihentikan.

## Tindak lanjut error npm run start — 26 Oktober 2026

- Masalah direproduksi: build gagal dengan 235 error TypeScript. node_modules/.prisma/client tidak ada; paket openai 6.49.0 tidak memiliki index.d.ts/index.d.mts atau deklarasi tipe lainnya. Error TS2339 model Prisma dan TS7016 OpenAI merupakan dampak instalasi dependency yang tidak lengkap, bukan alasan mengubah PrismaService menjadi any. Penyebab penghapusan file tersebut tidak dipastikan.
- npm ci memulihkan paket sesuai lockfile; Prisma Client 6.4.1 digenerate ulang. Tidak menaikkan versi Prisma/OpenAI atau mengubah resolusi dependency. Lockfile hanya menambah metadata hasInstallScript untuk lifecycle root.
- Script prisma:generate ditambahkan; postinstall, prestart dan prestart:dev menjalankannya otomatis. Tidak menjalankan db push/migrate/seed pada startup.
- JWT_SECRET pada .env lokal ternyata kosong/tidak tersedia. Diisi secret acak yang kuat tanpa mencetak nilainya. Nilai environment lainnya dipertahankan, termasuk URL database dan kredensial integrasi. Ini perubahan konfigurasi lokal pada tindak lanjut ini; keterangan .env tidak berubah pada tahap sebelumnya tetap merupakan riwayat pemeriksaan sebelumnya. File .env tetap diabaikan Git.
- Pemeriksaan ulang: postinstall berhasil, build backend lulus, 29 unit backend (18 suite) lulus. npm run start yang sebenarnya diuji pada port 3021 dengan environment terisolasi pertamuda_test dan gateway/AI dinonaktifkan: Nest application successfully started, GET /api/products 200 (0 produk publik pada baseline DRAFT), GET /api/admin/dashboard tanpa token 401. Log startup: artifacts/pertamuda-start-repair.log. Server pemeriksaan dihentikan sesudahnya.
- Tidak mengklaim startup terhadap database operasional/public diuji; tidak menjalankan migration produksi. Untuk demo gunakan npm run demo:start sesuai panduan. Peringatan layanan gateway/AI yang sengaja tidak dikonfigurasi pada runner test berbeda dari error kompilasi.

## Tindak lanjut P2022 pada public — 26 Oktober 2026

- Log pengguna memperlihatkan query ke public serta P2022 pada products.is_demo dan orders.stock_state. Ini schema lama, bukan schema pertamuda_test yang dimigrasi saat maintenance. Rekomendasi menjalankan start biasa sebelumnya tidak cukup jelas soal prasyarat schema.
- Pemeriksaan metadata read-only pada koneksi yang digunakan start mengonfirmasi 22 kolom yang dibutuhkan belum tersedia, termasuk tabel auth_sessions. Tidak menjalankan DDL, migration, backfill, atau reset pada public.
- Ditambahkan assertDatabaseSchemaCompatible sebelum NestFactory.create. Checker membandingkan nama kolom dari Prisma DMMF dengan information_schema pada current_schema; koneksi pemeriksaan selalu ditutup. Ini pemeriksaan keberadaan kolom, bukan audit menyeluruh tipe/constraint/index database.
- Schema yang tidak sesuai ditolak dengan DATABASE_SCHEMA_MISMATCH dan instruksi demo:start. Tidak mengabaikan kolom baru atau berpindah schema secara diam-diam. Provider, scheduler dan HTTP server belum dijalankan ketika pengecekan gagal.
- Build lulus; 33 unit backend lulus (19 suite), termasuk 4 regresi schema: lengkap, public tanpa kolom baru, schema kosong, dan kegagalan koneksi. Schema pertamuda_test lolos checker; backend hasil build berjalan di port 3022, katalog 200 dan admin tanpa token 401.
- Bukti: artifacts/pertamuda-public-schema-check.log, artifacts/pertamuda-incompatible-start.log dan artifacts/pertamuda-schema-guard-start.log. Server pemeriksaan dihentikan sesudah smoke test. Untuk demonstrasi hentikan backend public dan jalankan npm run demo:start dari backend/. Pemakaian data public dengan kode baru membutuhkan migrasi terpisah yang ditinjau dan belum dijalankan.

## Tindak lanjut finalisasi supplier PETANI — 26 Oktober 2026

- Bukti screenshot dan pemeriksaan read-only mengonfirmasi profil DALAM_VERIFIKASI pada pertamuda_test adalah PETANI tanpa alat suling, dengan 3 FOTO_FASILITAS APPROVED dan 1 SURAT_PERNYATAAN APPROVED. Tidak membaca isi berkas/NIK/rekening untuk diagnosis dan tidak menyetujui akun pengguna.
- Bug: submit dan checklist sudah membedakan jenis supplier, tetapi finalisasi mewajibkan Akta Koperasi/COA untuk semua jenis. Selain itu, submit sebelumnya belum mewajibkan Surat Pernyataan untuk PETANI/PENYULING meski UI/checklist mewajibkannya. Kini submit, detail admin dan finalisasi memakai sumber aturan yang sama.
- Finalisasi tetap mewajibkan 3 foto APPROVED, persetujuan dokumen lain yang relevan, tanggal COA valid untuk produsen minyak, dan status DALAM_VERIFIKASI. Akta/COA tetap wajib untuk kategori yang memerlukannya. Tidak ada bypass autentikasi/otorisasi maupun persetujuan otomatis.
- Status profil dan audit finalisasi disimpan atomik; klik finalisasi bersamaan menghasilkan satu persetujuan dan satu audit. Kegagalan audit menggagalkan perubahan status.
- UI kini menampilkan jenis supplier dan checklist dari server, menghindari persyaratan koperasi untuk PETANI, serta menunggu penyimpanan review sebelum mengaktifkan finalisasi. Verifikasi profil tidak meluluskan mutu batch.
- Hasil: 11 regresi HTTP/PostgreSQL terarah lulus (27,5 detik); 33 unit backend dan 22 unit frontend lulus. Backend build, frontend typecheck dan frontend build terisolasi lulus. Regresi API hanya membuat/menghapus akun fixture tersendiri; tidak menjalankan seed/reset global karena pengguna sudah menambahkan data pada schema pengujian.
- Kasus regresi: empat kombinasi jenis/alat suling; role non-admin ditolak; koperasi tanpa Akta/COA tetap ditolak; minimum 3 foto; review berkas melalui API; COA tanpa tanggal/kedaluwarsa/masa depan ditolak; submit membutuhkan Surat Pernyataan; submit tidak menjadi approval; finalisasi berulang; rollback ketika audit gagal. Log: artifacts/pertamuda-supplier-verification-e2e.log.
- Aturan lengkap: [supplier-verification.md](supplier-verification.md). Untuk memakai perbaikan, restart backend dengan npm run demo:start lalu muat ulang halaman admin. Persetujuan profil pengguna tetap harus dilakukan admin setelah meninjau berkasnya.

Pemeriksaan visual pada frontend build terisolasi (3025) dan API pertamuda_test (3024) berhasil: checklist menampilkan PETANI tanpa alat suling, foto 3/3, Surat Pernyataan 1/1, tanpa Akta/COA wajib; tombol finalisasi aktif. Tidak menekan finalisasi. Bukti hanya memuat checklist tanpa identitas/isi dokumen: artifacts/pertamuda-supplier-requirements.jpg. Sesi inspeksi di-logout, tab dan server tugas ditutup. Tidak menjalankan reset data pengguna.

## Tindak lanjut `npm run dev` frontend — 26 Oktober 2026

- Startup frontend pengguna gagal saat Next.js menghapus cache `.next`: `EINVAL readlink .next/server/src/middleware.js`. Inspeksi menunjukkan `.next` dan berkas tersebut beratribut reparse point OneDrive. Penyebab rinci terbentuknya reparse point belum dipastikan.
- Output development dipisah ke `.next-dev` melalui `distDir` saat `NODE_ENV=development`; output build demo tetap `.next-pertamuda` dengan flag yang sudah ada. Keduanya diabaikan Git dan direktori `.next` lama tidak dihapus. `tsconfig` mencakup tipe dari output development.
- `npm run dev` mencapai `Ready in 1796ms` pada port 3000 tanpa `EINVAL`; `npm run typecheck` dan `git diff --check` lulus. Percobaan GET localhost dari terminal pengujian dibatasi akses socket/timeout, sehingga respons halaman belum diklaim berhasil dalam tindak lanjut ini. Proses dev pengujian dihentikan setelah pemeriksaan startup.
