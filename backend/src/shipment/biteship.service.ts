import { Injectable, Logger } from '@nestjs/common';
import { BiteshipApiException } from './biteship-api.exception';

export interface BiteshipArea {
  id: string;
  name: string;
  postal_code: number;
  country_code: string;
  administrative_division_level_1_name: string; // Province
  administrative_division_level_2_name: string; // City/Kabupaten
  administrative_division_level_3_name: string; // Kecamatan
}

interface BiteshipRateInput {
  originPostalCode?: string;
  originAreaId?: string;
  destinationPostalCode?: string;
  destinationAreaId?: string;
  weightInGrams: number;
  itemValue: number;
  drumCount: number;
}

interface BiteshipOrderInput {
  shipper_contact_name: string;
  shipper_contact_phone: string;
  shipper_contact_email: string;
  shipper_organization: string;
  origin_contact_name: string;
  origin_contact_phone: string;
  origin_address: string;
  origin_postal_code?: string;
  origin_area_id?: string;
  destination_contact_name: string;
  destination_contact_phone: string;
  destination_address: string;
  destination_postal_code?: string;
  destination_area_id?: string;
  courier_company: string;
  courier_type: string;
  delivery_type: string;
  items: Array<{
    name: string;
    description: string;
    weight: number;
    quantity: number;
    value?: number;
  }>;
}

@Injectable()
export class BiteshipService {
  private readonly logger = new Logger(BiteshipService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly biteshipEnv: 'sandbox' | 'production';
  private readonly webhookSignatureKey: string;
  private readonly webhookToken: string;

  constructor() {
    this.apiKey = process.env.BITESHIP_API_KEY || '';
    this.baseUrl = process.env.BITESHIP_BASE_URL || 'https://api.biteship.com';
    this.biteshipEnv = (process.env.BITESHIP_ENV || 'sandbox') as 'sandbox' | 'production';
    this.webhookSignatureKey = process.env.BITESHIP_WEBHOOK_SIGNATURE_KEY || 'x-biteship-signature';
    this.webhookToken = process.env.BITESHIP_WEBHOOK_TOKEN || '';

    this.logger.log(`Biteship initialized in ${this.biteshipEnv} mode`);
  }

  isSandbox(): boolean {
    return this.biteshipEnv === 'sandbox';
  }

  // ─── Maps API: Search area_id ───────────────────────────────────────
  async searchArea(query: string): Promise<BiteshipArea[]> {
    if (!query || query.trim().length < 3) {
      return [];
    }

    if (this.isSandbox() && !this.apiKey) {
      this.logger.warn('Biteship sandbox without API key: returning empty area search results');
      return [];
    }

    try {
      const url = `${this.baseUrl}/v1/maps/areas?countries=ID&input=${encodeURIComponent(query)}&type=single`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`Biteship Maps API error: ${response.status} - ${errorBody}`);
        throw new BiteshipApiException(
          `Gagal mencari area: ${response.statusText}`,
          response.status,
          errorBody,
        );
      }

      const data = await response.json();
      if (!data.success || !Array.isArray(data.areas)) {
        return [];
      }

      return data.areas.map((area: any) => ({
        id: area.id,
        name: area.name,
        postal_code: area.postal_code,
        country_code: area.country_code,
        administrative_division_level_1_name: area.administrative_division_level_1_name,
        administrative_division_level_2_name: area.administrative_division_level_2_name,
        administrative_division_level_3_name: area.administrative_division_level_3_name,
      }));
    } catch (error) {
      if (error instanceof BiteshipApiException) throw error;
      this.logger.error(`Biteship searchArea error: ${error.message}`);
      throw new BiteshipApiException(`Gagal mencari area: ${error.message}`);
    }
  }

  // ─── Rates API ──────────────────────────────────────────────────────
  async getRates(input: BiteshipRateInput): Promise<any[]> {
    if (this.isSandbox() && !this.apiKey) {
      this.logger.log(`Biteship sandbox mode (no key): Generating mock rates for weight ${input.weightInGrams}g`);
      return this.getMockRates(input.weightInGrams);
    }

    try {
      // Build request body — prefer area_id over postal_code for accuracy
      const body: Record<string, any> = {
        couriers: 'jne,sicepat,wahana,anteraja,lion',
        items: [
          {
            name: 'Minyak Nilam',
            description: 'Patchouli Oil cargo shipment',
            value: input.itemValue,
            length: 60,
            width: 60,
            height: 90,
            weight: input.weightInGrams,
            quantity: input.drumCount,
          },
        ],
      };

      // Origin: prefer area_id
      if (input.originAreaId) {
        body.origin_area_id = input.originAreaId;
      } else if (input.originPostalCode) {
        body.origin_postal_code = input.originPostalCode;
      }

      // Destination: prefer area_id
      if (input.destinationAreaId) {
        body.destination_area_id = input.destinationAreaId;
      } else if (input.destinationPostalCode) {
        body.destination_postal_code = input.destinationPostalCode;
      }

      this.logger.log(`Biteship getRates request: origin=${input.originAreaId || input.originPostalCode}, dest=${input.destinationAreaId || input.destinationPostalCode}`);

      const response = await fetch(`${this.baseUrl}/v1/rates/couriers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`Biteship Rates API error: ${response.status} - ${errorBody}`);

        // In sandbox mode, fallback to mock data on API errors
        if (this.isSandbox()) {
          this.logger.warn('Sandbox mode: falling back to mock rates after API error');
          return this.getMockRates(input.weightInGrams);
        }

        // In production, throw error — never silently mock
        throw new BiteshipApiException(
          `Gagal mendapatkan tarif ongkir dari Biteship: ${response.statusText}`,
          response.status,
          errorBody,
        );
      }

      const data = await response.json();
      if (!data.success || !Array.isArray(data.pricing)) {
        // Biteship v1 returns rates in 'pricing' array
        // Also check for 'rates' for backward compatibility
        const ratesArray = data.pricing || data.rates;
        if (!Array.isArray(ratesArray) || ratesArray.length === 0) {
          if (this.isSandbox()) {
            this.logger.warn('Sandbox mode: no rates returned, using mock data');
            return this.getMockRates(input.weightInGrams);
          }
          throw new BiteshipApiException('Tidak ada tarif ongkir tersedia untuk rute ini');
        }

        return this.mapRates(ratesArray);
      }

      return this.mapRates(data.pricing);
    } catch (error) {
      if (error instanceof BiteshipApiException) throw error;

      this.logger.error(`Biteship getRates exception: ${error.message}`);

      if (this.isSandbox()) {
        this.logger.warn(`Sandbox mode: falling back to mock rates due to exception`);
        return this.getMockRates(input.weightInGrams);
      }

      throw new BiteshipApiException(`Gagal menghubungi Biteship API: ${error.message}`);
    }
  }

  private mapRates(rates: any[]): any[] {
    return rates.map((rate: any) => ({
      rateId: rate.courier_service_code || rate.id || `${rate.courier_code}_${rate.courier_service_code}`,
      kurirNama: rate.courier_name || rate.company,
      kurirKode: rate.courier_code || rate.company,
      serviceNama: rate.courier_service_name || rate.service,
      serviceKode: rate.courier_service_code || rate.type,
      ongkirDasar: rate.price,
      estimasiHari: parseInt(rate.duration?.replace(/\D/g, '')) || parseInt(rate.shipment_duration_range?.replace(/\D/g, '')) || 3,
      tersedia: true,
    }));
  }

  // ─── Create Order API ───────────────────────────────────────────────
  async createOrder(orderData: BiteshipOrderInput): Promise<any> {
    if (this.isSandbox() && !this.apiKey) {
      const trackingNumber = 'VALAM-DOM-' + Math.random().toString(36).substring(2, 11).toUpperCase();
      this.logger.log(`Biteship sandbox mode (no key): Generating mock shipping order with AWB ${trackingNumber}`);
      return {
        id: 'bship_order_' + Math.random().toString(36).substring(2, 9),
        trackingNumber,
        trackingUrl: `https://biteship.com/tracking/${trackingNumber}`,
      };
    }

    // Build body — include area_id when available
    const body: Record<string, any> = { ...orderData };

    // Clean up: remove undefined area_id fields
    if (!body.origin_area_id) delete body.origin_area_id;
    if (!body.destination_area_id) delete body.destination_area_id;
    if (!body.origin_postal_code) delete body.origin_postal_code;
    if (!body.destination_postal_code) delete body.destination_postal_code;

    try {
      const response = await fetch(`${this.baseUrl}/v1/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`Biteship create order error: ${response.status} - ${errorBody}`);

        if (this.isSandbox()) {
          this.logger.warn('Sandbox mode: generating fallback tracking for failed order creation');
          const trackingNumber = 'VALAM-DOM-' + Math.random().toString(36).substring(2, 11).toUpperCase();
          return {
            id: 'fallback_bship_order_' + Math.random().toString(36).substring(2, 9),
            trackingNumber,
            trackingUrl: `https://biteship.com/tracking/${trackingNumber}`,
          };
        }

        throw new BiteshipApiException(
          `Gagal membuat order pengiriman di Biteship: ${response.statusText}`,
          response.status,
          errorBody,
        );
      }

      const data = await response.json();
      return {
        id: data.id,
        trackingNumber: data.courier?.waybill_id || 'AWB-PENDING',
        trackingUrl: data.courier?.link || `https://biteship.com/tracking/${data.courier?.waybill_id}`,
      };
    } catch (error) {
      if (error instanceof BiteshipApiException) throw error;

      this.logger.error(`Biteship createOrder exception: ${error.message}`);

      if (this.isSandbox()) {
        const trackingNumber = 'VALAM-DOM-' + Math.random().toString(36).substring(2, 11).toUpperCase();
        return {
          id: 'fallback_bship_order_' + Math.random().toString(36).substring(2, 9),
          trackingNumber,
          trackingUrl: `https://biteship.com/tracking/${trackingNumber}`,
        };
      }

      throw new BiteshipApiException(`Gagal menghubungi Biteship API: ${error.message}`);
    }
  }

  // ─── Webhook Verification ───────────────────────────────────────────
  /**
   * Verifies Biteship webhook by checking the custom header key/value
   * configured in the Biteship dashboard under Integration → Webhook.
   *
   * Dashboard config:
   *   - Headers Signature Key  → env: BITESHIP_WEBHOOK_SIGNATURE_KEY (e.g. "x-biteship-signature")
   *   - Headers Signature Secret → env: BITESHIP_WEBHOOK_TOKEN (the secret value)
   *
   * The incoming webhook request must contain a header matching the key,
   * with its value equal to the token/secret.
   */
  verifyWebhook(headers: Record<string, string>): boolean {
    // In sandbox mode without a webhook token configured, allow all
    if (this.isSandbox() && !this.webhookToken) {
      this.logger.warn('Sandbox mode: skipping webhook verification (no token configured)');
      return true;
    }

    if (!this.webhookToken) {
      this.logger.error('BITESHIP_WEBHOOK_TOKEN is not configured — rejecting webhook');
      return false;
    }

    // Normalize header keys to lowercase for comparison
    const normalizedHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      normalizedHeaders[key.toLowerCase()] = String(value);
    }

    const signatureKey = this.webhookSignatureKey.toLowerCase();
    const receivedToken = normalizedHeaders[signatureKey];

    if (!receivedToken) {
      this.logger.warn(`Webhook rejected: missing header '${this.webhookSignatureKey}'`);
      return false;
    }

    const isValid = receivedToken === this.webhookToken;
    if (!isValid) {
      this.logger.warn(`Webhook rejected: invalid signature value`);
    }

    return isValid;
  }

  // ─── Mock Rates (sandbox only) ──────────────────────────────────────
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
        tersedia: true,
      },
      {
        rateId: 'rate_sicepat_gokil',
        kurirNama: 'SiCepat',
        kurirKode: 'sicepat',
        serviceNama: 'Gokil (Cargo)',
        serviceKode: 'gokil',
        ongkirDasar: Math.round(weightInKg * 2200),
        estimasiHari: 3,
        tersedia: true,
      },
      {
        rateId: 'rate_anteraja_cargo',
        kurirNama: 'Anteraja',
        kurirKode: 'anteraja',
        serviceNama: 'Cargo',
        serviceKode: 'cargo',
        ongkirDasar: Math.round(weightInKg * 2000),
        estimasiHari: 5,
        tersedia: true,
      },
    ];
  }
}
