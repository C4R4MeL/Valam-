# Aturan transaksi dan batas integrasi

## Stok dan status

Semua checkout baru memakai CommerceService: cek MOQ/volume, pengurangan stok
bersyarat stok >= jumlah, penciptaan order/items, dan pencatatan reservasi berada
dalam satu transaksi PostgreSQL. Penguncian advisory per order/key/wallet
menyatukan perilaku beberapa proses. Idempotency key yang sama mengacu pada
satu kesepakatan; pemakaian untuk isi berbeda ditolak.

- Order baru: PENDING, pembayaran pending, stock_state RESERVED selama 30 menit.
- Konfirmasi gateway: pembayaran paid, stock_state CONSUMED. Tidak mengurangi
  stok untuk kedua kalinya dan tidak menambah wallet.
- Pemasok: PENDING → PACKED → SHIPPED, hanya jika sudah paid/CONSUMED.
  Unggahan bukti tidak menyelesaikan order atau mencairkan dana.
- Buyer: SHIPPED → COMPLETED, hanya jika paid/CONSUMED dan tidak ada kendala
  pengiriman aktif. Endpoint orders dan shipment memakai fungsi yang sama.
- Kredit wallet dan perubahan COMPLETED atomik. Referensi order + tipe ledger
  unik; permintaan ulang/paralel tidak menghasilkan kredit kedua.
- Cancel/deny/failure/expire sebelum pembayaran: stok reservasi dikembalikan
  sekali. Job expiry memeriksa ulang status dalam lock sebelum mengembalikan.
- Pembayaran tiba sesudah stok dilepas/expiry: PAYMENT_REVIEW, tanpa fulfillment
  otomatis atau kredit wallet. Dana diterima tidak disembunyikan sebagai gagal.
- Pembatalan pesanan paid: REFUND_REQUESTED. Ini **bukan** refund gateway.
- Full refund dari status gateway terkonfirmasi: REFUNDED. Stok dikembalikan
  hanya untuk barang yang belum dikirim. Barang terkirim memerlukan bukti
  pengembalian fisik; tidak otomatis menambah stok.
- Partial refund: REFUND_REVIEW dan wallet dibekukan untuk rekonsiliasi; tidak
  menebak jumlah barang yang dikembalikan.
- Refund setelah kredit wallet: satu REFUND_DEBIT, saldo tersedia dikurangi,
  kekurangan dicatat sebagai refund_due, tanpa membuat saldo negatif. Wallet
  dibekukan sampai rekonsiliasi; kredit berikutnya mengurangi kewajiban dahulu.

Stok batch/produk yang sudah dipublikasikan atau memiliki order tidak boleh
ditimpa lewat edit inventori. Buat batch baru untuk penambahan persediaan.
Penghapusan batch yang terkait order ditolak tanpa menghapus bukti QC/trace.
Endpoint reset order tidak dapat menghapus status finansial; reset demonstrasi
hanya melalui script schema testing.

Nominal IDR dibulatkan per subtotal baris ke rupiah, kemudian dijumlahkan.
Midtrans item_details memakai satu line item sejumlah subtotal agar volume kg
pecahan tidak diperlakukan sebagai quantity integer gateway. Harga/kg dan
volume kesepakatan tetap tersimpan pada OrderItem.

## Pembayaran dan webhook

Signature SHA-512 atas order_id, status_code, gross_amount, ServerKey wajib
valid. Karena tidak seluruh field status berada dalam signature itu, aplikasi
juga membaca Get Status API dan memakai status otoritatif serta referensi/nominal
yang cocok dengan payment tersimpan. Gateway gagal dihubungi tidak mengubah
status transaksi. Callback pending/failed lama tidak menurunkan status paid.
ID pembayaran harus cocok persis; tidak menebak order dari suffix retry.

Dasar protokol: [Midtrans HTTP notifications](https://docs.midtrans.com/docs/https-notification-webhooks)
dan [best practices](https://docs.midtrans.com/reference/best-practices-to-handle-notification).
Transport gateway pada tes diganti mock; validasi signature/nominal dan seluruh
transaksi database tetap dijalankan. Ini bukan hasil pengujian gateway sandbox.

Webhook Biteship tetap menolak secret kosong meskipun mode sandbox. Peristiwa
pengiriman tidak mengkredit wallet dan tidak menurunkan status yang sudah maju.
Kendala dan status terminal tidak dihapus oleh callback berulang.

## Penarikan dan batas layanan

Withdrawal adalah permintaan PENDING, belum transfer bank. Rekening diambil dari
profil tersimpan, bukan instruksi bank bebas pada request. Saldo dan ledger
permintaan diperbarui atomik; pengulangan request key tidak mendebit lagi.
Tidak tersedia disbursement bank, escrow pihak ketiga, atau smart contract.
Pengajuan refund dicatat untuk pemrosesan; panggilan refund gateway otomatis
belum diimplementasikan. REFUNDED hanya muncul dari konfirmasi gateway.

Order lama dengan stock_state NONE tidak diasumsikan sudah mereservasi stok.
Rekonsiliasi diperlukan sebelum fulfillment/pencairan. Migration indeks unik
akan berhenti jika referensi ledger lama duplikat; jangan menghapus ledger atau
memakai accept-data-loss. Migration belum diterapkan ke schema operasional.

Konfigurasi yang ada belum dapat dipakai menguji Midtrans sandbox, dan secret
webhook pengiriman belum tersedia. Pengguna meminta tes otomatis tanpa gateway.
Checkout tanpa gateway terkonfigurasi gagal dengan jelas; reservasinya dilepas
oleh expiry jika persiapan gateway gagal. Tidak ada pembayaran nyata dilakukan.

## Batas yang masih perlu diuji

- Pembayaran Midtrans sandbox, pembuatan/penjemputan Biteship sandbox, dan
  disbursement/refund operasional belum dijalankan.
- Beberapa supplier dalam satu checkout menjadi order terpisah. Kegagalan
  transport di tengah proses dapat menyisakan sebagian order pending; lihat
  daftar pesanan dan tunggu/batalkan reservasi sebelum mencoba kesepakatan baru.
- Panggilan pickup ke provider eksternal memerlukan pengujian retry/timeout
  sandbox; transaksi lokal tidak dapat menjamin atomisitas di sistem provider.
