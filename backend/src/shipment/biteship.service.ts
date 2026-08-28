import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BiteshipService {
  private readonly logger = new Logger(BiteshipService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly webhookSecret: string;

  constructor() {
    this.apiKey = process.env.BITESHIP_API_KEY || 'biteship_test_key_dummy';
    this.baseUrl = process.env.BITESHIP_BASE_URL || 'https://api.biteship.com';
    this.webhookSecret = process.env.BITESHIP_WEBHOOK_SECRET || 'valam_biteship_secret';
  }

  private isSandbox(): boolean {
    return !this.apiKey || this.apiKey === 'biteship_test_key_dummy' || this.apiKey.startsWith('biteship_test');
  }

  async getRates(
    originPostalCode: string,
    destinationPostalCode: string,
    weightInGrams: number,
    value: number,
    drumCount: number
  ): Promise<any[]> {
    if (this.isSandbox()) {
      this.logger.log(`Biteship sandbox mode: Generating mock rates for weight ${weightInGrams}g`);
      return this.getMockRates(weightInGrams);
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/rates/couriers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          origin_postal_code: originPostalCode,
          destination_postal_code: destinationPostalCode,
          couriers: 'jne,sicepat,wahana,anteraja,lion',
          items: [
            {
              name: 'Minyak Nilam',
              description: 'Patchouli Oil cargo shipment',
              value: value,
              length: 60,
              width: 60,
              height: 90,
              weight: weightInGrams,
              quantity: drumCount
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Biteship rates request failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success || !Array.isArray(data.rates)) {
        return this.getMockRates(weightInGrams);
      }

      // Filter only cargo and trucking options
      const filteredRates = data.rates.filter((rate: any) => 
        rate.type === 'cargo' || rate.type === 'trucking' || rate.service?.toLowerCase().includes('cargo') || rate.service?.toLowerCase().includes('truck')
      );

      if (filteredRates.length === 0) {
        return this.getMockRates(weightInGrams);
      }

      return filteredRates.map((rate: any) => ({
        rateId: rate.id,
        kurirNama: rate.company,
        kurirKode: rate.company,
        serviceNama: rate.service,
        serviceKode: rate.type,
        ongkirDasar: rate.price,
        estimasiHari: parseInt(rate.etd?.split('-')[0]) || 3,
        tersedia: true
      }));
    } catch (error) {
      this.logger.warn(`Failed to contact Biteship API, falling back to mock rates: ${error.message}`);
      return this.getMockRates(weightInGrams);
    }
  }

  async createOrder(orderData: any): Promise<any> {
    if (this.isSandbox()) {
      const trackingNumber = 'VALAM-DOM-' + Math.random().toString(36).substring(2, 11).toUpperCase();
      this.logger.log(`Biteship sandbox mode: Generating mock shipping order with AWB ${trackingNumber}`);
      return {
        id: 'bship_order_' + Math.random().toString(36).substring(2, 9),
        trackingNumber,
        trackingUrl: `https://biteship.com/tracking/${trackingNumber}`
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error(`Biteship create order failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        trackingNumber: data.courier?.waybill_id || 'AWB-PENDING',
        trackingUrl: data.courier?.link || `https://biteship.com/tracking/${data.courier?.waybill_id}`
      };
    } catch (error) {
      this.logger.warn(`Failed to create order on Biteship, generating fallback shipping tracking: ${error.message}`);
      const trackingNumber = 'VALAM-DOM-' + Math.random().toString(36).substring(2, 11).toUpperCase();
      return {
        id: 'fallback_bship_order_' + Math.random().toString(36).substring(2, 9),
        trackingNumber,
        trackingUrl: `https://biteship.com/tracking/${trackingNumber}`
      };
    }
  }

  verifyWebhook(signature: string, body: any): boolean {
    // In dev sandbox, let signature validation pass
    if (this.isSandbox()) return true;
    
    // In production, we compare the webhook signature
    return signature === this.webhookSecret;
  }

  private getMockRates(weightInGrams: number): any[] {
    const weightInKg = Math.max(weightInGrams / 1000, 1.0);
    return [
      {
        rateId: 'rate_jne_jtr',
        kurirNama: 'JNE',
        kurirKode: 'jne',
        serviceNama: 'JTR (JNE Trucking)',
        serviceKode: 'jtr',
        ongkirDasar: Math.round(weightInKg * 2500),
        estimasiHari: 4,
        tersedia: true
      },
      {
        rateId: 'rate_sicepat_gokil',
        kurirNama: 'SiCepat',
        kurirKode: 'sicepat',
        serviceNama: 'Gokil (Cargo)',
        serviceKode: 'gokil',
        ongkirDasar: Math.round(weightInKg * 2200),
        estimasiHari: 3,
        tersedia: true
      },
      {
        rateId: 'rate_anteraja_cargo',
        kurirNama: 'Anteraja',
        kurirKode: 'anteraja',
        serviceNama: 'Cargo',
        serviceKode: 'cargo',
        ongkirDasar: Math.round(weightInKg * 2000),
        estimasiHari: 5,
        tersedia: true
      }
    ];
  }
}
