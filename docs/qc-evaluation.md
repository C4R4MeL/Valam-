# Pencatatan dan evaluasi mutu batch

Saat ini repository tidak memuat dasar evaluasi laboratorium yang tervalidasi
beserta versi, metode, satuan, rentang batas per grade, dan persetujuan penanggung
jawab. Angka standar contoh di UI lama tidak dijadikan aturan bisnis.

Karena itu setiap pencatatan baru memakai status `UNEVALUATED`. Menyimpan hasil,
menerima sampel, menerbitkan harga, atau memverifikasi identitas pemasok tidak
menyatakan batch lulus. Tidak ada sertifikat yang diterbitkan otomatis.

Validasi input hanya memeriksa bentuk data: PA dan moisture 0–100%, specific
gravity/refractive index tidak negatif, optical rotation -360 sampai 360, format
tanggal/URL. Rentang ini **bukan** standar kelulusan mutu. Parameter tanpa hasil
disimpan null; nol tetap nol. Tanggal uji hanya dicatat jika disediakan.

`lab_name`, `report_number`, `tested_at` dan `source_document_url` merekam sumber
yang disediakan admin. Keberadaan metadata bukan bukti akreditasi atau
keaslian dokumen. `evaluation_rule_version` tetap kosong sampai aturan evaluasi
yang sah diterapkan bersama tes batas/parameter hilang dan audit provenance.
Endpoint sertifikat lama menolak dokumen tanpa versi evaluasi.

Status internal produk `VERIFIED` merupakan istilah lama untuk publikasi katalog;
tidak lagi menjadi dasar badge laboratorium. API menyediakan `lab_verified=false`
dan `quality_status=UNEVALUATED` secara eksplisit. Verifikasi identitas pemasok
ditampilkan terpisah. Evaluasi mutu sungguhan masih memerlukan dasar evaluasi
dan proses verifikasi laboratorium yang disepakati.

Harga batch berjenis OFFER adalah penawaran pemasok; DEMONSTRATION pada fixture
berlabel demonstrasi. Harga Insights adalah indikatif, bukan harga transaksi.
Data harga kosong/gagal tidak dilengkapi angka atau tanggal hari ini.
