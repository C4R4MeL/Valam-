import { PartialType } from '@nestjs/swagger';
import { RegisterSupplierDto } from './register-supplier.dto';
import { IsOptional, Matches } from 'class-validator';

export class UpdateSupplierDto extends PartialType(RegisterSupplierDto) {
  @IsOptional()
  @Matches(/^\d{5}$/, { message: 'Kode pos asal pengiriman harus terdiri dari 5 digit' })
  postalCode?: string | null;
}
