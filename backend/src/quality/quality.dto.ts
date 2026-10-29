import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MaxLength,
  ArrayMaxSize,
  ValidateNested,
  Equals,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PartnerDto {
  @IsString() @IsNotEmpty() @MaxLength(255) name: string;
  @IsString() @MaxLength(100) kind: string;
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  logo_url?: string;
  @IsOptional() @IsString() @MaxLength(2000) address?: string;
  @IsOptional() @IsString() @MaxLength(2000) contact?: string;
  @IsArray() @ArrayMaxSize(50) @IsString({ each: true }) services: string[];
  @IsOptional() @IsString() @MaxLength(5000) instructions?: string;
  @IsOptional() @IsString() @MaxLength(2000) fees?: string;
  @IsOptional() @IsString() @MaxLength(2000) sample_requirements?: string;
  @IsOptional() @IsString() @MaxLength(2000) turnaround?: string;
  @IsOptional() @IsString() @MaxLength(2000) result_channel?: string;
  @IsOptional() @IsString() @MaxLength(5000) permission_notes?: string;
  @IsBoolean() publish_name: boolean;
  @IsBoolean() publish_logo: boolean;
  @IsBoolean() publish_reports: boolean;
  @IsBoolean() visible: boolean;
  @IsBoolean() accepting_requests: boolean;
  @IsIn(['EXPLORATORY', 'ACTIVE', 'SUSPENDED', 'ENDED']) status: string;
}
export class RequestDto {
  @IsUUID() product_id: string;
  @IsUUID() partner_id: string;
  @IsString() @IsNotEmpty() @MaxLength(255) service: string;
  @IsUUID() key: string;
  @IsOptional() @IsString() @MaxLength(255) sample_identity?: string;
  @IsOptional() @IsString() @MaxLength(5000) notes?: string;
}
export class TransitionDto {
  @IsIn(['AWAITING_SHIPMENT', 'SHIPPED', 'RECEIVED', 'TESTING', 'CANCELLED'])
  status: string;
  @IsString() @IsNotEmpty() @MaxLength(5000) notes: string;
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  evidence?: string;
  @IsOptional() @IsString() @MaxLength(2000) shipping_info?: string;
  @IsUUID() key: string;
}
export class ParameterDto {
  @IsString() @IsNotEmpty() @MaxLength(255) name: string;
  @IsString() @IsNotEmpty() @MaxLength(500) value: string;
  @IsOptional() @IsString() @MaxLength(100) unit?: string;
  @IsOptional() @IsString() @MaxLength(500) method?: string;
}
export class ReportDto {
  @IsUUID() product_id: string;
  @IsUUID() partner_id: string;
  @IsOptional() @IsUUID() request_id?: string;
  @IsUUID() file_id: string;
  @IsString() @IsNotEmpty() @MaxLength(255) report_number: string;
  @IsString() @IsNotEmpty() @MaxLength(255) sample_identity: string;
  @IsOptional() @IsDateString() tested_at?: string;
  @IsOptional() @IsDateString() issued_at?: string;
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ParameterDto)
  parameters: ParameterDto[];
  @IsOptional() @IsString() @MaxLength(5000) conclusion?: string;
  @IsString() @IsNotEmpty() @MaxLength(2000) source: string;
  @IsBoolean() publication_allowed: boolean;
  @IsBoolean() is_demo: boolean;
  @IsOptional() @IsUUID() replaces_id?: string;
  @IsUUID() key: string;
}
export class ChecklistDto {
  @Equals(true) issuer: boolean;
  @Equals(true) batch_sample: boolean;
  @Equals(true) report_number: boolean;
  @Equals(true) dates: boolean;
  @Equals(true) completeness: boolean;
}
export class ReviewDto {
  @IsIn(['APPROVED', 'REVISION_REQUESTED', 'REJECTED', 'REVOKED'])
  status: string;
  @IsString() @IsNotEmpty() @MaxLength(5000) notes: string;
  @IsOptional()
  @ValidateNested()
  @Type(() => ChecklistDto)
  checklist?: ChecklistDto;
  @IsUUID() key: string;
}
