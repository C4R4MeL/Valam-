# Aturan verifikasi dokumen pemasok

Aturan ini adalah aturan aplikasi VALAM, bukan penetapan bahwa setiap dokumen
atau batch telah memenuhi standar laboratorium atau persyaratan hukum tertentu.
Admin tetap meninjau isi berkas dan bertanggung jawab atas keputusan review.

| Jenis pemasok | Akta Koperasi | COA | Foto fasilitas | Surat Pernyataan |
| --- | --- | --- | --- | --- |
| PETANI tanpa alat suling | Tidak wajib | Tidak wajib | Minimum 3 disetujui | Wajib disetujui |
| PETANI dengan alat suling | Tidak wajib | Wajib, tanggal valid | Minimum 3 disetujui | Wajib disetujui |
| PENYULING | Tidak wajib | Wajib, tanggal valid | Minimum 3 disetujui | Wajib disetujui |
| KOPERASI | Wajib disetujui | Wajib, tanggal valid | Minimum 3 disetujui | Wajib disetujui |

- Submit memeriksa kelengkapan sesuai jenis pemasok. Dokumen yang diunggah
  tidak otomatis menjadi APPROVED. Penolakan dokumen tetap menghalangi submit.
- Finalisasi membaca ulang profil dan status dokumen dari database. Hanya profil
  DALAM_VERIFIKASI dapat difinalisasi; nilai jenis pemasok dari client tidak digunakan.
- COA yang dihitung untuk memenuhi syarat harus APPROVED, memiliki tanggal valid,
  tidak berada di masa depan, dan berumur maksimum 180 hari kalender (Asia/Jakarta).
  Batas ini mempertahankan kebijakan umur dokumen pada aplikasi; tidak membuktikan
  akreditasi laboratorium, keaslian laporan, atau mutu semua batch.
- Foto minimum dihitung berdasarkan jumlah berkas APPROVED, bukan semua unggahan.
  Berkas lama/opsional tidak dianggap sebagai pengganti jenis dokumen wajib lain.
- Status profil dan audit finalisasi ditulis dalam satu transaksi. Finalisasi berulang
  diserialkan agar tidak menghasilkan dua audit persetujuan.
- Detail admin mengirim documentCompleteness sebagai sumber checklist frontend.
  UI menampilkan jenis pemasok, jumlah disetujui/minimum dan masalah tanggal COA;
  tombol finalisasi dinonaktifkan selama review sedang disimpan atau syarat belum terpenuhi.
- Verifikasi profil pemasok berbeda dari evaluasi mutu batch. Tidak menerbitkan
  sertifikat batch, mengisi hasil uji, atau menyatakan QC lulus melalui finalisasi profil.

Regresi API terarah memakai akun dan berkas fixture baru di pertamuda_test.
Pemeriksaan ini tidak menyetujui, mereset, atau menghapus profil/berkas milik pengguna.
