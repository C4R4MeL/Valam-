import { IsString, IsNotEmpty, IsEmail, IsNumber, IsOptional, IsArray, IsEnum, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GradeNilam } from '@prisma/client';

export class RegisterSupplierDto {
  @ApiProperty({ description: 'Nama koperasi sesuai akta' })
  @IsString()
  @IsNotEmpty({ message: 'Nama koperasi wajib diisi' })
  @MaxLength(200)
  namaKoperasi: string;

  @ApiProperty({ description: 'NIB koperasi dari OSS' })
  @IsString()
  @IsNotEmpty({ message: 'NIB wajib diisi' })
  nib: string;

  @ApiProperty({ description: 'NPWP koperasi' })
  @IsString()
  @IsNotEmpty({ message: 'NPWP wajib diisi' })
  npwp: string;

  @ApiProperty({ description: 'Nama ketua/pengurus penanggung jawab' })
  @IsString()
  @IsNotEmpty({ message: 'Nama PIC wajib diisi' })
  namaPic: string;

  @ApiProperty({ description: 'Nomor KTP ketua/pengurus' })
  @IsString()
  @IsNotEmpty({ message: 'KTP PIC wajib diisi' })
  ktpPic: string;

  @ApiProperty({ description: 'Nomor WhatsApp aktif' })
  @IsString()
  @IsNotEmpty({ message: 'Nomor WhatsApp wajib diisi' })
  whatsapp: string;

  @ApiProperty({ description: 'Alamat lengkap' })
  @IsString()
  @IsNotEmpty({ message: 'Alamat lengkap wajib diisi' })
  alamatLengkap: string;

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

  @ApiProperty({ description: 'Estimasi kapasitas produksi per bulan (kg)' })
  @IsNumber()
  @Min(0, { message: 'Kapasitas produksi tidak boleh negatif' })
  kapasitasProduksi: number;

  @ApiProperty({ description: 'Grade nilam yang bisa dipasok', enum: GradeNilam, isArray: true })
  @IsArray()
  @IsEnum(GradeNilam, { each: true, message: 'Grade harus salah satu dari GRADE_A, GRADE_B, GRADE_C' })
  gradeNilam: GradeNilam[];

  // Opsional — rekening bank
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
