# Matching dan sampel

Algoritma yang dipakai adalah MCDM dengan jarak Euclidean berbobot ke titik
ideal. Ini bukan TOPSIS: tidak menghitung jarak ke solusi ideal negatif.
Bobot kebijakan internal: PA 0,40; harga 0,30; moisture 0,15; volume 0,15.
Bobot ini bukan klaim standar industri atau akurasi empiris.

Normalisasi min–max dilakukan pada batch dengan empat nilai valid. PA dan volume
adalah benefit, harga dan moisture adalah cost. Jika semua nilai suatu parameter
sama, normalisasi dimensi tersebut 1. Skor relatif =
`100 * (1 - sqrt(sum(weight * (1 - normalized)^2)))`, dibatasi 0–100.
Skor bukan probabilitas kecocokan atau sertifikat mutu.

Kelayakan dihitung terpisah: volume >= kebutuhan, harga/kg <= budget,
PA >= minimum, moisture <= maksimum, dan volume kebutuhan >= MOQ.
Data hilang/invalid adalah syarat tidak terpenuhi, bukan nol. Moisture nol yang
benar-benar tercatat tetap nol. Batch tanpa data lengkap tidak mendapat skor.
Mutu seluruh catatan masih UNEVALUATED sesuai kebijakan QC saat ini.

API menyediakan `matches` dan `alternatives`, ditambah `data` gabungan untuk
kompatibilitas. Maksimum lima per kelompok; alternatif berskor tinggi tidak
menggeser batch yang memenuhi semua batas. Setiap hasil memuat alasan yang
terpenuhi/tidak terpenuhi. Frontend hanya memakai perhitungan backend dan tidak
menyimpan skor cadangan ketika API gagal.

Permintaan sampel mengarahkan buyer ke kontak pemasok dari batch yang sebenarnya,
dengan kode batch dan tautan sumber di pesan yang dapat ditinjau pengguna.
Tidak mengirim pesan otomatis, tidak menyimpan permintaan atau mengklaim sampel
sudah dikirim. Jika kontak belum tersedia, tombol dinonaktifkan dan kondisinya
ditampilkan; tidak memakai nomor contoh. Alamat lab untuk supplier juga tidak
diisi dengan institusi/alamat rekaan.
