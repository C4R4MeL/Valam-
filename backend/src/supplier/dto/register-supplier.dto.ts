import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, IsEnum, IsBoolean, MaxLength, Min, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GradeNilam, SupplierSubtype } from '@prisma/client';

export class RegisterSupplierDto {
  // ── Sub-tipe (wajib) ───────────────────────────────────────────
  @ApiProperty({ description: 'Sub-tipe supplier', enum: SupplierSubtype })
  @IsEnum(SupplierSubtype, { message: 'supplierSubtype harus salah satu dari PETANI, PENYULING, KOPERASI' })
  supplierSubtype: SupplierSubtype;

  // ── Shared Fields (wajib semua sub-tipe) ───────────────────────
  @ApiProperty({ description: 'Nama lengkap (KTP) / Nama Ketua PIC' })
  @IsString()
  @IsNotEmpty({ message: 'Nama PIC / Nama Lengkap wajib diisi' })
  namaPic: string;

  @ApiProperty({ description: 'NIK KTP (16 digit)' })
  @IsString()
  @IsNotEmpty({ message: 'NIK KTP wajib diisi' })
  @Length(16, 16, { message: 'NIK KTP harus tepat 16 digit' })
  @Matches(/^\d{16}$/, { message: 'NIK KTP harus berupa 16 digit angka' })
  ktpPic: string;

  @ApiProperty({ description: 'Nomor WhatsApp aktif' })
  @IsString()
  @IsNotEmpty({ message: 'Nomor WhatsApp wajib diisi' })
  whatsapp: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Kabupaten wajib diisi' })
  kabupaten: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Kecamatan wajib diisi' })
  kecamatan: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Desa wajib diisi' })
  desa: string;

  // ── Koperasi-specific (wajib hanya untuk KOPERASI) ─────────────
  @ApiPropertyOptional({ description: 'Nama koperasi sesuai akta (wajib untuk KOPERASI)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  namaKoperasi?: string;

  @ApiPropertyOptional({ description: 'NIB dari OSS (wajib untuk KOPERASI, opsional untuk PENYULING)' })
  @IsOptional()
  @IsString()
  nib?: string;

  @ApiPropertyOptional({ description: 'NPWP (wajib untuk KOPERASI, opsional untuk PENYULING)' })
  @IsOptional()
  @IsString()
  npwp?: string;

  @ApiPropertyOptional({ description: 'Alamat lengkap (wajib untuk KOPERASI)' })
  @IsOptional()
  @IsString()
  alamatLengkap?: string;

  // ── Kapasitas & Grade (wajib untuk PENYULING & KOPERASI) ───────
  @ApiPropertyOptional({ description: 'Kapasitas produksi minyak (kg/bulan)' })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Kapasitas produksi tidak boleh negatif' })
  kapasitasProduksi?: number;

  @ApiPropertyOptional({ description: 'Grade nilam yang bisa dipasok', enum: GradeNilam, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(GradeNilam, { each: true, message: 'Grade harus salah satu dari GRADE_A, GRADE_B, GRADE_C' })
  gradeNilam?: GradeNilam[];

  // ── Petani-specific ────────────────────────────────────────────
  @ApiPropertyOptional({ description: 'Estimasi luas lahan (Ha) — wajib untuk PETANI' })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Luas lahan tidak boleh negatif' })
  luasLahan?: number;

  @ApiPropertyOptional({ description: 'Estimasi panen (kg/bulan, daun basah) — wajib untuk PETANI' })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Estimasi panen tidak boleh negatif' })
  estimasiPanen?: number;

  @ApiPropertyOptional({ description: 'Apakah punya alat suling sendiri?' })
  @IsOptional()
  @IsBoolean()
  punyaAlatSuling?: boolean;

  // ── Koperasi Pembina (opsional, untuk PETANI/PENYULING) ────────
  @ApiPropertyOptional({ description: 'ID Koperasi pembina (FK ke supplier_profiles)' })
  @IsOptional()
  @IsString()
  koperasiPembinaId?: string;

  // ── Opsional Storefront / Bank ─────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nomorRekening?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  namaBank?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  namaRekening?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tahunBerdiri?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  jumlahAnggota?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minimumOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  durasiProduksi?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metodeDistilasi?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bahanBaku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website?: string;
}
