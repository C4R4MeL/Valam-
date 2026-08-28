import { IsArray, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LegacyMigrationDto {
  @ApiProperty({ description: 'IDs supplier yang akan dimigrasikan', type: [String] })
  @IsArray()
  supplierIds: string[];

  @ApiPropertyOptional({ description: 'Jumlah hari deadline (default 30)', default: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  deadlineDays?: number;
}
