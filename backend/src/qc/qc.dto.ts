import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class RecordQcDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  pa_percentage?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  moisture?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  specific_gravity?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  refractive_index?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(-360)
  @Max(360)
  optical_rotation?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  lab_notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  lab_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  report_number?: string;

  @IsOptional()
  @IsDateString()
  tested_at?: string;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  source_document_url?: string;
}
