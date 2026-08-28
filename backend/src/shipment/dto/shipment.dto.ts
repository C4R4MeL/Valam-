import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { Incoterms } from '@prisma/client';

export class ConfirmOngkirDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  selectedRateId: string;
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
