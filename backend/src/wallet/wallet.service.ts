import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getWallet(supplierId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { user_id: supplierId },
      include: {
        transactions: {
          orderBy: { created_at: 'desc' }
        }
      }
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { user_id: supplierId, balance: 0 },
        include: { transactions: true }
      });
    }

    return wallet;
  }

  async requestWithdrawal(supplierId: string, amount: number, bankDetails: string) {
    const wallet = await this.getWallet(supplierId);

    if (Number(wallet.balance) < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    // Deduct balance
    await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: amount } }
    });

    // Create pending transaction
    const transaction = await this.prisma.walletTransaction.create({
      data: {
        wallet_id: wallet.id,
        type: 'DEBIT',
        amount: amount,
        description: `Penarikan Dana ke ${bankDetails}`
      }
    });

    return transaction;
  }
}
