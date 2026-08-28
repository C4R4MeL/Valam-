import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Kata sandi minimal 6 karakter' })
  @IsNotEmpty({ message: 'Kata sandi tidak boleh kosong' })
  password: string;
}
