import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
export class CreateBatchDto {
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9_.-]+$/)
  @MaxLength(100)
  batch_code?: string;
  @IsOptional() @IsString() @MaxLength(255) origin_village?: string;
  @IsOptional() @IsString() @MaxLength(255) origin_district?: string;
  @IsOptional() @IsString() @MaxLength(255) origin_province?: string;
  @IsOptional() @IsDateString() production_date?: string;
  @IsNumber() @Min(0.001) total_volume_kg: number;
  @IsOptional() @IsNumber() @Min(0) price_per_kg?: number;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(7_000_000, { each: true })
  images?: string[];
}
