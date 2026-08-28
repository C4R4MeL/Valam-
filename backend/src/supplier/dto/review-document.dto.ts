import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReviewAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  REQUEST_REVISION = 'REQUEST_REVISION',
}

export class ReviewDocumentDto {
  @ApiProperty({ description: 'Aksi review', enum: ReviewAction })
  @IsEnum(ReviewAction, { message: 'Aksi harus salah satu dari: APPROVE, REJECT, REQUEST_REVISION' })
  aksi: ReviewAction;

  @ApiPropertyOptional({ description: 'Catatan reviewer (wajib jika reject/revision)' })
  @IsOptional()
  @IsString()
  catatan?: string;
}
