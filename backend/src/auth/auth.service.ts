import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async onModuleInit() {
    // Seed standard roles if not exist
    const roles = ['admin', 'supplier', 'buyer'];
    for (const roleName of roles) {
      const existing = await this.prisma.role.findUnique({ where: { name: roleName } });
      if (!existing) {
        await this.prisma.role.create({ data: { name: roleName } });
      }
    }
  }

  async register(registerDto: RegisterDto) {
    const { email, password, roleName, companyName, phone, address, fullName, country } = registerDto;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const role = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      throw new ConflictException('Role not found');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role_id: role.id,
        profile: {
          create: {
            company_name: companyName,
            phone,
            address,
            contact_person: fullName,
            country: country || 'ID',
          },
        },
      },
    });

    return { message: 'Registration successful', userId: user.id };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true, profile: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id, role: user.role.name };
    return {
      access_token: this.jwtService.sign(payload),
      role: user.role.name,
      country: user.profile?.country || 'ID',
      name: user.profile?.company_name || user.profile?.contact_person || user.email.split('@')[0],
    };
  }
}
