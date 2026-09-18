import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
  IsUUID,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Incoterms } from '@prisma/client';

export class ConfirmOngkirDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  selectedRateId: string;
}

export class QuoteGroupItemDto {
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsUUID()
  circularProductId?: string;

  @IsNumber()
  @Min(0.01)
  quantityKg: number;
}

export class QuoteGroupDto {
  @IsUUID()
  supplierId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuoteGroupItemDto)
  items: QuoteGroupItemDto[];
}

export class QuoteShipmentDto {
  @IsString()
  @IsNotEmpty()
  destinationAddress: string;

  @IsOptional()
  @IsString()
  destinationPostalCode?: string;

  @IsOptional()
  @IsString()
  destinationAreaId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuoteGroupDto)
  groups: QuoteGroupDto[];
}

export class EksporShippingDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsEnum(Incoterms)
  @IsNotEmpty()
  incoterms: Incoterms;

  @IsString()
  @IsOptional()
  portOrigin?: string;

  @IsString()
  @IsNotEmpty()
  portDestination: string;

  @IsString()
  @IsOptional()
  forwarderName?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  estimasiFreight?: number;

  @IsString()
  @IsOptional()
  exportNotes?: string;
}

export class ReportMasalahDto {
  @IsString()
  @IsNotEmpty()
  catatan: string;
}

export class ResolveMasalahDto {
  @IsString()
  @IsNotEmpty()
  catatan: string;

  @IsString()
  @IsNotEmpty()
  aksi: 'LANJUTKAN' | 'BATALKAN';
}

export class ConfirmPickupDto {
  @IsString()
  @IsOptional()
  pickupPhoto?: string;
}
