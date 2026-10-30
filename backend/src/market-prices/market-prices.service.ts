import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface MarketPriceRow {
  id: string;
  grade: 'A' | 'B' | 'C';
  price_per_kg: number;
  currency: string;
  updated_by: string | null;
  updated_at: Date;
}

export type PriceHistoryRow = Omit<MarketPriceRow, 'updated_by' | 'updated_at'> & { recorded_at: Date };

@Injectable()
export class MarketPricesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.$queryRaw<MarketPriceRow[]>`
      SELECT id, grade, price_per_kg::double precision AS price_per_kg,
             currency, updated_by, updated_at
      FROM insights_market_prices ORDER BY grade
    `;
  }

  history(grade: string, limit: number) {
    if (!['A', 'B', 'C'].includes(grade)) {
      throw new BadRequestException('Grade tidak valid');
    }
    return this.prisma.$queryRaw<PriceHistoryRow[]>`
      SELECT id, grade, price_per_kg::double precision AS price_per_kg,
             currency, recorded_at
      FROM insights_market_price_history
      WHERE grade::text = ${grade}
      ORDER BY recorded_at DESC LIMIT ${limit}
    `;
  }

  async update(id: string, price: number, userId: string) {
    // Use the application's authenticated database connection. Browser Supabase
    // sessions do not contain the backend JWT's admin identity.
    // The existing database trigger records history in the same transaction.
    const rows = await this.prisma.$queryRaw<MarketPriceRow[]>`
      UPDATE insights_market_prices
      SET price_per_kg = ${price}, updated_at = now(),
          updated_by = (SELECT id FROM insights_authors WHERE user_id = ${userId}::uuid LIMIT 1)
      WHERE id = ${id}::uuid
      RETURNING id, grade, price_per_kg::double precision AS price_per_kg,
                currency, updated_by, updated_at
    `;
    if (!rows.length) throw new NotFoundException('Data harga tidak ditemukan');
    return rows[0];
  }
}
