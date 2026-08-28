import { IsEnum, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipeDocument } from '@prisma/client';

export class UploadDocumentDto {
  @ApiProperty({ description: 'Tipe dokumen', enum: TipeDocument })
  @IsEnum(TipeDocument, { message: 'Tipe dokumen harus salah satu dari: AKTA_KOPERASI, COA, FOTO_FASILITAS, SURAT_PERNYATAAN' })
  @IsNotEmpty()
  tipeDocument: TipeDocument;

  @ApiPropertyOptional({ description: 'Tanggal COA (wajib jika tipe = COA). Format: YYYY-MM-DD' })
  @IsOptional()
  @IsDateString({}, { message: 'Format tanggal COA harus YYYY-MM-DD' })
  tanggalCoa?: string;
}
