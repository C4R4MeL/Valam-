import { PartialType } from '@nestjs/swagger';
import { RegisterSupplierDto } from './register-supplier.dto';

export class UpdateSupplierDto extends PartialType(RegisterSupplierDto) {}
