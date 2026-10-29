import { Injectable, ServiceUnavailableException } from '@nestjs/common';
const midtransClient = require('midtrans-client');

@Injectable()
export class MidtransGateway {
  private readonly mode = process.env.MIDTRANS_IS_PRODUCTION || 'false';
  private readonly production = this.mode === 'true';
  private readonly serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  private readonly snap = new midtransClient.Snap({
    isProduction: this.production,
    serverKey: this.serverKey,
    clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
  });

  assertConfigured() {
    if (!['true', 'false'].includes(this.mode)) {
      throw new ServiceUnavailableException('MIDTRANS_IS_PRODUCTION harus bernilai true atau false.');
    }
    if (!this.serverKey.trim()) {
      throw new ServiceUnavailableException(
        'MIDTRANS_SERVER_KEY belum diisi. Konfigurasikan key Midtrans sesuai mode pembayaran sebelum checkout.',
      );
    }
    // Key prefixes are not an environment contract. The SDK selects endpoints
    // from isProduction; Midtrans itself validates credentials for that endpoint.
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
