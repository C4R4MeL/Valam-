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

  private assertConfigured() {
    if (
      !this.serverKey ||
      (!this.production && !this.serverKey.startsWith('SB-')) ||
      (this.production && process.env.NODE_ENV === 'test')
    ) {
      throw new ServiceUnavailableException(
        'Payment gateway belum dikonfigurasi untuk lingkungan yang benar',
      );
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
