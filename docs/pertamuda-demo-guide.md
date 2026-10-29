# Panduan demonstrasi Pertamuda

Gunakan branch `codex/pertamuda-readiness`. Seluruh perintah `demo:*` backend
menurunkan koneksi dari `backend/.env` ke schema **pertamuda_test**, memverifikasi
lingkungan, dan mengosongkan kredensial gateway/pengiriman/AI di proses anak.
Jangan gunakan script seed/clean lama atau mengubah `.env` operasional untuk demo.

## Persiapan lokal

1. Di `backend/`: `npm ci`, `npx prisma generate`, `npm run demo:prepare`.
   Jika ada peringatan perubahan yang memerlukan penerimaan kehilangan data,
   berhenti dan tinjau migration; jangan tambahkan `--accept-data-loss`.
2. `npm run demo:seed` membuat akun buyer, supplier, admin dan tiga batch
   bertanda DEMONSTRASI. Kredensial acak ada di file lokal yang diabaikan Git:
   `backend/.pertamuda-credentials.json`. Jangan tampilkan file ini di layar demo.
3. Hentikan backend yang dijalankan dengan `npm run start` (Ctrl+C), lalu jalankan `npm run demo:start` (API port 3001). Server memakai JWT secret acak;
   setelah restart, login kembali. Integrasi eksternal sengaja dinonaktifkan.
4. Di terminal frontend, arahkan `NEXT_PUBLIC_API_URL` ke `http://localhost:3001/api`;
   arahkan `NEXT_PUBLIC_SUPABASE_URL` ke `http://127.0.0.1:54321` dan
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` ke placeholder lokal. Jangan gunakan key payment
   produksi. Jalankan `npm run dev` (port 3000); output development memakai `.next-dev` agar terpisah dari cache `.next` dan build demo. Untuk `npm run build`/`npm start`, gunakan `PERTAMUDA_FRONTEND_BUILD=true` pada kedua perintah agar output berada di `.next-pertamuda`. Variabel NEXT_PUBLIC untuk build harus ditetapkan sebelum build, bukan hanya ketika menjalankan `npm start`.

## Urutan presentasi singkat

- Jelaskan data DEMONSTRASI, harga demonstrasi, status QC belum dievaluasi,
  dan perbedaan identitas pemasok dengan mutu batch.
- Login buyer, supplier dan admin bergantian; tunjukkan dashboard sesuai peran.
  Supplier melihat batch sendiri; admin melihat antrian QC. Akses silang harus ditolak.
- Baseline reset sengaja berisi batch **DRAFT**, tanpa hasil laboratorium,
  sertifikat, dokumen identitas atau rekening palsu. Katalog publik kosong adalah
  kondisi yang benar. Jangan menyebutnya batch lulus lab atau pemasok terverifikasi.
- Untuk publikasi katalog interaktif, selesaikan profil pemasok melalui alur normal,
  catat hasil dan sumber QC yang benar lewat admin (kosong tetap kosong), kemudian
  tetapkan harga lewat supplier. Publikasi bukan evaluasi mutu. Tidak ada tombol bypass.
- Tunjukkan matching: kecocokan penuh terpisah dari alternatif; nilai yang tidak
  tersedia tidak menjadi nol. Permintaan sampel hanya menautkan kontak yang tersedia.
- NILA menjelaskan batas akses; dalam runner demo tanpa key, layanan chat akan
  menampilkan kegagalan konfigurasi. Eco tidak memiliki angka dampak terverifikasi.
- Alur transaksi end-to-end saat ini ditunjukkan melalui **hasil tes otomatis**,
  bukan pembayaran interaktif: checkout/RFQ → reservasi stok → notifikasi pembayaran
  terverifikasi dengan transport tiruan → kirim → penerimaan buyer → satu kredit ledger.
  Jangan menampilkan token tiruan dari tes sebagai token Snap sungguhan.

## Regresi dan pemulihan

Jalankan di backend (hentikan demo yang sedang dipakai sebelum reset):

```text
npm run demo:test:guard
npm run demo:test:e2e
npm run demo:test:data
npm run demo:reset
```

`demo:test:data` menjalankan seed berulang dan reset sebagai bagian pengujian.
`demo:reset` menghapus data **hanya schema pertamuda_test** dan mengisi ulang
3 akun, 3 batch DRAFT (500 kg/MOQ 10/Rp850.000; 100 kg/MOQ 5/Rp780.000;
stok habis 0 kg/MOQ 5/Rp680.000), wallet nol, tanpa pesanan/QC/sertifikat.
Seed biasa tidak menambah duplikat atau memulihkan stok transaksi yang sedang berjalan.
Reset menghapus sesi: login kembali pada semua dashboard.

## Batas serah terima

- Midtrans sandbox menunggu kredensial sesuai keputusan pengguna. Biteship webhook
  secret belum tersedia. Tes provider/pickup nyata, xAI langsung, transfer penarikan,
  dan refund keluar belum dijalankan. Tidak ada pembayaran nyata.
- Saldo wallet adalah ledger internal; permintaan penarikan bukan bukti transfer bank.
  Refund requested berbeda dari refund terkonfirmasi; partial refund perlu rekonsiliasi.
- Aturan kelulusan QC belum tersedia, sehingga mutu tetap belum dievaluasi.
- Ekspor/L/C, audit bucket eksternal, dan ketahanan panggilan provider terhadap timeout
  memerlukan pekerjaan operasional lanjutan. Jangan menjanjikan escrow pihak ketiga.
- Lint masih gagal; hasil rinci dan seluruh pemeriksaan ada di `pertamuda-readiness.md`.

Pemeriksaan penutup: 29/29 tes integrasi API/bisnis lulus (81,7 detik), 29 unit backend,
19 unit frontend, 10 guard dan 1 seed/reset integrasi lulus. Lint masih gagal.
Detail run yang gagal/diulang dan keterbatasan browser ada di readiness.

Jika muncul P2022 seperti products.is_demo atau orders.stock_state, periksa
nama schema di log. public belum menerima migration maintenance; jangan
menjalankan db push/reset pada public untuk memperbaikinya. Startup kini
menolak schema yang kolomnya belum sesuai sebelum API/scheduler berjalan.
Gunakan demo:start untuk schema pertamuda_test yang telah disiapkan.
