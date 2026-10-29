# Integrasi main dan Supabase — 29 Oktober 2026

Seluruh perubahan aplikasi yang sebelumnya berada di working tree branch
`codex/quality-partnership-workflow` digabungkan: kesiapan demo, autentikasi sesi,
integritas transaksi/RFQ, verifikasi pemasok, mitra dan laporan pengujian,
perbaikan sidebar admin, serta navbar pemasok dengan satu label statis.
Branch lokal DetailProduct dan pertamuda-readiness menunjuk commit dasar yang
sama. Dokumen PRD/design/development pada origin/staging sama dengan main;
riwayat staging yang terpisah ikut digabungkan dengan mempertahankan .gitignore
terbaru. File .env, akun demo lokal, unggahan privat, dan output pengujian tidak
disertakan dalam commit.

## Database operasional

Target yang diperiksa adalah schema `public` pada Supabase yang terkonfigurasi
di backend. Seluruh rantai delapan migrasi diuji di schema sementara baru dan
dibandingkan dengan schema Prisma yang dibuat terpisah. Pemeriksaan meliputi
nama/tipe/nullability/default kolom, index, primary/foreign key, enum, dan RLS
yang diwajibkan. Tabel Insights, auth, storage, dan objek Supabase lain yang
tidak dikelola aplikasi tidak dihapus atau dimigrasi.

Baseline 20260917 mendokumentasikan struktur aplikasi lama; migrasi penyesuaian
20261029 melengkapi perbedaan DDL manual yang tidak tercakup migrasi fitur.
Timestamp Circular Products tetap TIMESTAMPTZ(6), UUID tetap dapat dihasilkan
database, dan penghapusan produk yang direferensikan order tetap RESTRICT.
Kolom profil khusus koperasi menjadi nullable untuk mendukung petani/penyuling.
Tabel sesi dan data mutu privat dilindungi RLS tanpa akses langsung browser.

Migrasi pada public dijalankan dalam satu transaksi. Sebelum/sesudahnya, jumlah
baris dan sidik semua nilai kolom lama pada **24 tabel aplikasi identik**.
Tidak ada reset, seed akun demo, penghapusan ledger, rekayasa laporan mutu,
atau perubahan nilai data bisnis lama. Mitra awal ARC USK dibuat oleh migrasi
mutu dengan penerimaan pengajuan masih ditutup sampai layanan dikonfigurasi.

Hasil akhir: **nol selisih struktur yang diwajibkan**, delapan migrasi tercatat
dan checksum diverifikasi. Schema guard startup serta query Prisma untuk
produk, order, Circular Products, mitra, dan laporan berhasil secara read-only.
Bukti lokal: `artifacts/main-supabase-apply.log` dan
`artifacts/main-supabase-initial-release.json` (tidak dipush).

## Validasi aplikasi

- Backend: 41 tes pada 21 suite, serta build Nest lulus setelah generate ulang
  Prisma Client.
- Frontend: 43 tes pada 15 suite, serta build Next.js lulus.
- Pengaman lingkungan/migrasi demo: 12 tes lulus.
- Alur mutu: 14 tes integrasi PostgreSQL dan HTTP guards lulus pada schema
  sementara yang dibersihkan sesudah pengujian.
- Build frontend masih melewati lint sesuai konfigurasi proyek. Kelulusan
  build tidak dianggap sebagai bukti lint bersih. Gateway pembayaran,
  pengiriman eksternal, dan disbursement nyata tidak dijalankan pada rilis ini.

## Pemeliharaan berikutnya

Dari direktori backend:

```sh
npm ci
npm run db:audit
npm run db:release
npm run build
```

`db:audit` tidak mengubah public; ia membuat dan membersihkan schema sementara
untuk memverifikasi rantai migrasi dan membandingkan metadata. `db:release`
hanya boleh dijalankan dengan DIRECT_URL/DATABASE_URL yang secara eksplisit
menargetkan public. Perintah menolak checksum berbeda atau migrasi gagal,
menerapkan SQL yang ditinjau dalam transaksi, membandingkan sidik data lama,
lalu mencatat migrasi Prisma. Pada database yang sudah sesuai, migrasi lama
tidak dijalankan ulang. Jangan mengubah berkas migrasi yang sudah tercatat;
tambahkan migrasi baru. File SQL dipertahankan LF agar checksum lintas OS sama.

Startup tidak menjalankan migrasi atau seed otomatis. Untuk demo tetap gunakan
`npm run demo:start` dengan schema pertamuda_test yang terpisah.

## Tindak lanjut katalog buyer kosong

Pemeriksaan read-only setelah integrasi menemukan 9 batch VERIFIED pada public
dan 1 batch VERIFIED demonstrasi pada pertamuda_test. Output ProductsService
memiliki PA null untuk semuanya karena belum ada hasil dari laporan yang lolos
peninjauan dan diizinkan untuk publikasi. Ini berbeda dari nilai QC lama yang
tersimpan; nilai lama tidak dipromosikan menjadi hasil terverifikasi.

Filter frontend selalu menerapkan PA 20–40, sehingga null tersaring dan katalog
menampilkan nol produk. Filter bawaan kini menyertakan batch tanpa hasil PA.
Rentang PA yang dipersempit dan pilihan grade tetap memerlukan nilai PA nyata;
null tidak diperlakukan sebagai nol atau grade Commercial. Reset filter
mengembalikan batch yang menunggu hasil ditinjau. Status publikasi, harga,
stok, dan aturan akses tetap mengikuti data/API. Tidak ada perubahan database
atau persetujuan laporan otomatis. Tiga regresi halaman katalog dan typecheck
frontend lulus. Build frontend juga lulus memakai direktori output baru melalui
`VALAM_FRONTEND_DIST`, karena cache build lama terkena EINVAL/readlink OneDrive.

## Tindak lanjut pilihan kurir checkout

Halaman checkout sebelumnya mencari area tujuan, tetapi tidak pernah memanggil
permintaan quote awal. State quote yang belum tersedia langsung ditampilkan
sebagai rute tanpa layanan. Quote sekarang dimuat otomatis setelah area tersedia,
perubahan alamat dijeda singkat sebelum menghitung ulang, dan respons area/quote lama diabaikan setelah
tujuan berubah. Status belum dimuat, API gagal, respons tidak lengkap, dan
respons sukses dengan rates kosong dibedakan. Retry API tetap tersedia.

Inspeksi read-only pada pemasok bernama PT. Global Utama juga menemukan lokasi
asal belum memiliki postal_code/area_id. Form Pengaturan Profil supplier kini
memuat dan menyimpan **Kode Pos Asal Pengiriman** melalui endpoint pemilik yang
sudah ada. API menerima kode pos lima digit atau pengosongan eksplisit. Saat
kode pos berubah, area_id lama dikosongkan agar tidak menimpa kode pos baru
dalam permintaan Biteship. Mengubah field lain atau menyimpan kode pos yang
sama mempertahankan lokasi yang sudah ada.

Kolom database tersebut sudah tersedia; tidak ada migrasi maupun pengisian
alamat pemasok otomatis. Kode pos lokasi penjemputan yang sebenarnya harus
diisi pemilik supplier. Tidak ada panggilan quote provider nyata, pembuatan
pengiriman, atau pembayaran dalam pemeriksaan ini. **10 tes terarah** lulus:
5 quote checkout, 1 form pengaturan, dan 4 validasi/penyimpanan asal supplier.
Pemeriksaan tipe frontend serta build backend dan frontend lulus. Tidak ada
perubahan schema database yang diperlukan untuk perbaikan ini.

## Tindak lanjut pembayaran localhost (sandbox)

Pengguna memilih sandbox. Kedua mode lokal bernilai false. Diagnosis awal
yang menyimpulkan environment key hanya dari awalan ternyata keliru: key lokal
tanpa awalan SB diterima API Sandbox. GET status untuk referensi acak mendapat
respons provider 404 Transaction doesn't exist, sedangkan kontrol dengan key
acak yang sengaja tidak valid ditolak HTTP 401. Kunci rahasia pada .env tidak
diubah, ditampilkan oleh pemeriksaan, atau dipush.
Order lama pada log telah EXPIRED dan stock_state RELEASED; pemeriksaan hanya
read-only, tanpa pembatalan, perubahan saldo, atau pembayaran nyata.

Perbaikan kode:

- Checkout memeriksa konfigurasi gateway sebelum membaca keranjang, membuat
  order/pengiriman/payment, atau mereservasi stok. Retry RFQ juga diperiksa
  sebelum mengubah referensi gateway.
- Key kosong atau nilai flag environment yang tidak valid menghasilkan HTTP 503.
  Endpoint SDK dipilih melalui MIDTRANS_IS_PRODUCTION, bukan awalan key;
  autentikasi key diserahkan kepada Midtrans pada endpoint yang dipilih.
  Mode production tetap ditolak dalam lingkungan tes otomatis.
  Penolakan kredensial provider dilaporkan tanpa isi respons sensitif;
  kegagalan transport/token menjadi HTTP 502, bukan exception HTTP 500 generik.
- Callback Snap onSuccess tidak langsung menyatakan pembayaran sukses.
  Halaman menunggu status paid dari backend; PAYMENT_REVIEW menampilkan
  kebutuhan rekonsiliasi. Polling juga berhenti pada expired.
- Retry menampilkan error backend dan keluar dari status processing jika
  Snap tidak tersedia. Redirect yang diberikan backend dapat dipakai sebagai
  fallback. Template backend/.env.example memakai mode sandbox dengan key kosong
  yang harus diisi dari dashboard yang sesuai, tanpa mengasumsikan awalan wajib.

Validasi: **56 unit backend** dan **9 tes halaman checkout** lulus, termasuk
preflight tanpa efek tulis, penolakan flag yang salah, error HTTP, token kosong,
konfirmasi backend, pembayaran yang perlu ditinjau, dan kegagalan Snap/retry.
Pemeriksaan tipe frontend serta build backend dan frontend lulus. Sesudah
koreksi validator prefix, 12 tes terarah dijalankan ulang dan build backend
lulus. Gateway hasil build juga berhasil membuat token Snap melalui provider
Sandbox asli, dengan redirect host app.sandbox.midtrans.com. Referensi khusus
pengujian digunakan tanpa informasi pelanggan, tanpa order Supabase, dan tanpa
menyelesaikan pembayaran. Token/secret tidak dicetak; bukti lokal hanya memuat
status keberhasilan pada artifacts/payment-sandbox-token-check.json.

Gunakan pasangan key dari dashboard Midtrans dengan environment
**Sandbox → Settings → Access Keys**. Key lokal saat pemeriksaan diterima
Sandbox; format awalan tidak digunakan sebagai bukti environment. Konfigurasi:

```dotenv
# backend/.env
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_SERVER_KEY=<server-key-dari-dashboard-sandbox>
MIDTRANS_CLIENT_KEY=<client-key-dari-dashboard-sandbox>

# frontend/.env
NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=false
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=<client-key-sandbox-yang-sama>
```

Restart backend dengan npm run start:dev dan frontend dengan npm run dev.
Runner demo:start sengaja mengosongkan key pembayaran sehingga tidak cocok
untuk pengujian provider sandbox langsung.

Pembayaran sampai status paid juga memerlukan notifikasi server yang dapat
dijangkau Midtrans. Route proyek adalah POST /api/payment/notification. Untuk
localhost, gunakan URL tunnel publik ke backend sandbox atau backend publik
yang memakai key sandbox dan database yang sama; jangan mengasumsikan nilai
environment deployment Railway mengikuti .env lokal. Atur Payment Notification
URL pada dashboard Sandbox. Tidak ada tunnel atau setting akun Midtrans yang
diubah otomatis.

Referensi: [mode dan key Midtrans](https://docs.midtrans.com/docs/switching-to-production-mode)
dan [notifikasi pembayaran](https://docs.midtrans.com/docs/https-notification-webhooks).
