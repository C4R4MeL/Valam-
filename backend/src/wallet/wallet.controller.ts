import { Controller, Get, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @Roles('SUPPLIER')
  async getWallet(@Request() req: any) {
    return this.walletService.getWallet(req.user.userId);
  }

  @Post('withdraw')
  @Roles('SUPPLIER')
  async withdraw(@Request() req: any, @Body() body: { amount: number, bankDetails: string }) {
    // Check bank account is set
    const supplier = await this.prisma.supplierProfile.findUnique({
      where: { user_id: req.user.userId },
    });

    if (!supplier || !supplier.nomor_rekening) {
      throw new BadRequestException(
        'Lengkapi informasi rekening bank Anda di pengaturan profil sebelum mencairkan pembayaran.',
      );
    }

    return this.walletService.requestWithdrawal(req.user.userId, body.amount, body.bankDetails);
  }
}

