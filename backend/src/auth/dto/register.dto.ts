import { IsEmail, IsString, MinLength, IsOptional, IsNotEmpty } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Kata sandi minimal 6 karakter' })
  @IsNotEmpty({ message: 'Kata sandi tidak boleh kosong' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Peran tidak boleh kosong' })
  roleName: string;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  npwp?: string;
}
