import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommerceService, rupiah } from '../commerce/commerce.service';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService, private readonly commerce: CommerceService) {}

  getWallet(supplierId: string) {
    return this.prisma.wallet.upsert({ where: { user_id: supplierId }, update: {},
      create: { user_id: supplierId }, include: { transactions: { orderBy: { created_at: 'desc' } } } });
  }

  async requestWithdrawal(supplierId: string, value: number, bankDetails: string, requestKey: string) {
    const amount = rupiah(value);
    if (amount !== value || typeof requestKey !== 'string' || !/^[a-zA-Z0-9_-]{8,100}$/.test(requestKey)) throw new BadRequestException('Nominal atau idempotency key tidak valid');
    return this.prisma.$transaction(async tx => {
      await this.commerce.lock(tx, 'wallet:' + supplierId);
      const key = supplierId + ':' + requestKey;
      const existing = await tx.withdrawal.findUnique({ where: { request_key: key } });
      if (existing) {
        if (Number(existing.amount) !== amount) throw new ConflictException('Permintaan berbeda memakai idempotency key yang sama');
        return existing;
      }
      const supplier = await tx.supplierProfile.findUnique({ where: { user_id: supplierId } });
      if (!supplier?.nomor_rekening || !supplier.nama_bank || !supplier.nama_rekening) throw new BadRequestException('Rekening pemasok belum lengkap');
      const wallet = await tx.wallet.upsert({ where: { user_id: supplierId }, update: {}, create: { user_id: supplierId } });
      if (wallet.frozen || Number(wallet.refund_due) > 0) throw new BadRequestException('Wallet memerlukan rekonsiliasi refund sebelum penarikan');
      if (Number(wallet.balance) < amount) throw new BadRequestException('Saldo tidak cukup');
      const withdrawal = await tx.withdrawal.create({ data: { wallet_id: wallet.id, amount, request_key: key,
        bank_name: supplier.nama_bank, account_number: supplier.nomor_rekening, account_holder_name: supplier.nama_rekening, status: 'PENDING' } });
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: amount } } });
      await tx.walletTransaction.create({ data: { wallet_id: wallet.id, type: 'DEBIT', amount, description: 'Permintaan penarikan ' + withdrawal.id + ' menunggu pemrosesan; belum transfer bank' } });
      return withdrawal;
    }, { timeout: 30000, maxWait: 10000 });
  }
}
