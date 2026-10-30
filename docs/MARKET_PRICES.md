# Pembaruan harga pasar nilam

Harga saat ini bersumber dari tabel `insights_market_prices`. Riwayat bersumber
dari `insights_market_price_history`, yang diisi trigger database
`trg_insights_market_price_history` pada transaksi pembaruan harga.

Frontend membaca harga melalui `GET /api/market-prices` dan riwayat melalui
`GET /api/market-prices/:grade/history?limit=10`. Admin menyimpan melalui
`PATCH /api/market-prices/:id` dengan payload `price_per_kg` berupa angka positif
(maksimal dua angka desimal) dan token sesi aplikasi pada header Bearer.
Backend memvalidasi sesi dan peran Admin. Identitas penulis ditentukan backend;
Admin tidak perlu mempunyai sesi Supabase Auth atau profil penulis Insights.

Seluruh tampilan harga publik memakai `useMarketPrices`: harga hero beranda,
tabel harga, teaser Insights, widget, ringkasan dan sidebar Insights, footer,
kisaran harga pada Smart Matching, serta acuan harga di formulir Supplier.
Hook berbagi permintaan dan data, memuat ulang setelah penyimpanan pada tab
yang sama, menerima pemberitahuan tab lain, memuat ulang saat tab aktif, dan
memeriksa perubahan setiap 60 detik selama tab terlihat. Karena itu perubahan
dari perangkat lain muncul pada pemeriksaan berikutnya atau saat tab aktif.

Jika data kosong atau permintaan gagal, UI menampilkan harga belum tersedia.
Tidak ada angka pengganti atau tanggal pembaruan buatan. Harga batch dan nilai
penawaran RFQ tetap merupakan data transaksi tersendiri.

Deploy backend dan frontend bersama karena pembacaan harga sekarang melalui
API backend. `NEXT_PUBLIC_API_URL` harus menunjuk backend yang terhubung ke
database harga. Tidak diperlukan migrasi baru untuk perbaikan ini; tabel dan
trigger memakai skema Insights yang sudah ada. Migrasi dan seed lama merupakan
data inisialisasi historis, bukan sumber nilai cadangan UI; jangan dijalankan
ulang untuk mengganti harga yang telah diperbarui Admin.

Skrip pemeliharaan `scripts/update-market-prices.js` membutuhkan berkas JSON
berisi array objek `grade`, `price_per_kg`, dan `currency` yang diisi operator.
Skrip tidak lagi menetapkan harga pasar bawaan. Untuk pemakaian normal, gunakan
halaman Admin agar pemeriksaan sesi dan peran dilakukan API.

Validasi perbaikan mencakup akses HTTP publik/Admin, penolakan peran lain dan
nilai tidak valid, notifikasi perubahan, sinkronisasi tab, penolakan respons
lama, penanganan kegagalan riwayat, serta pembaruan tujuh tampilan harga utama.
Pembaruan, pembacaan kembali, dan trigger riwayat juga diverifikasi pada database
yang dikonfigurasi dalam transaksi yang dibatalkan tanpa menyimpan harga uji.
