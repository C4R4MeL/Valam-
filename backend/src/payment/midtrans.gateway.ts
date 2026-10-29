import { Injectable, ServiceUnavailableException } from '@nestjs/common';
const midtransClient = require('midtrans-client');

@Injectable()
export class MidtransGateway {
  private readonly production = process.env.MIDTRANS_IS_PRODUCTION === 'true';
  private readonly serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  private readonly snap = new midtransClient.Snap({
    isProduction: this.production,
    serverKey: this.serverKey,
    clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
  });

  assertConfigured() {
    if (!this.serverKey.trim()) {
      throw new ServiceUnavailableException(
        'MIDTRANS_SERVER_KEY belum diisi. Konfigurasikan key Midtrans sesuai mode pembayaran sebelum checkout.',
      );
    }
    if (!this.production && !this.serverKey.startsWith('SB-Mid-server-')) {
      throw new ServiceUnavailableException(
        'Mode pembayaran sandbox membutuhkan MIDTRANS_SERVER_KEY Sandbox (SB-Mid-server-...). Ambil key dari dashboard Sandbox Midtrans, lalu restart backend.',
      );
    }
    if (this.production && !this.serverKey.startsWith('Mid-server-')) {
      throw new ServiceUnavailableException(
        'Mode pembayaran production membutuhkan Server Key Production Midtrans. Pastikan mode frontend dan backend sesuai.',
      );
    }
    if (this.production && process.env.NODE_ENV === 'test') {
      throw new ServiceUnavailableException('Pembayaran production tidak diizinkan dalam lingkungan pengujian.');
    }
  }

  createTransaction(parameter: object) {
    this.assertConfigured();
    return this.snap.createTransaction(parameter);
  }

  status(orderId: string): Promise<Record<string, any>> {
    this.assertConfigured();
    return this.snap.transaction.status(orderId);
  }
}
