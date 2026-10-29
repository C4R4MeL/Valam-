import type { InsightMarketPrice, MarketGrade } from '@/lib/valam-insights/types';

export const MARKET_GRADES: MarketGrade[] = ['A', 'B', 'C'];

export const GRADE_SPECS: Record<
  MarketGrade,
  {
    pa: string;
    paMin: number;
    marketId: string;
    marketEn: string;
    highlight: boolean;
  }
> = {
  A: {
    pa: '≥ 32%',
    paMin: 32,
    marketId: 'Eropa, Jepang',
    marketEn: 'Europe, Japan',
    highlight: true,
  },
  B: {
    pa: '28–31%',
    paMin: 28,
    marketId: 'Timur Tengah',
    marketEn: 'Middle East',
    highlight: false,
  },
  C: {
    pa: '< 28%',
    paMin: 22,
    marketId: 'Domestik',
    marketEn: 'Domestic',
    highlight: false,
  },
};

/** Fallback when insights_market_prices is empty — same as marketplace/footer. */
export const FALLBACK_PRICES: Record<MarketGrade, number> = {
  A: 850_000,
  B: 780_000,
  C: 680_000,
};

export function normalizeGrade(raw: string | null | undefined): MarketGrade | null {
  if (!raw) return null;
  const code = raw.replace(/^GRADE_/i, '').trim().toUpperCase();
  if (code === 'A' || code === 'B' || code === 'C') return code;
  return null;
}

export function compactIdr(amount: number): string {
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    const s = Number.isInteger(m) ? String(m) : m.toFixed(1).replace(/\.0$/, '');
    return `Rp ${s}jt`;
  }
  const k = Math.round(amount / 1_000);
  return `Rp ${k}k`;
}

export function mergeMarketPrices(
  live: Array<Pick<InsightMarketPrice, 'grade' | 'price_per_kg' | 'currency' | 'updated_at' | 'id'>> | null | undefined,
): InsightMarketPrice[] {
  const byGrade = new Map<MarketGrade, InsightMarketPrice>();

  for (const row of live || []) {
    const grade = normalizeGrade(String(row.grade));
    if (!grade) continue;
    if (!Number.isFinite(Number(row.price_per_kg)) || Number(row.price_per_kg) <= 0) continue;
    byGrade.set(grade, {
      id: row.id || `live-${grade}`,
      grade,
      price_per_kg: Number(row.price_per_kg),
      currency: row.currency || 'IDR',
      updated_by: null,
      updated_at: row.updated_at || '',
    });
  }

  return MARKET_GRADES.flatMap(grade => byGrade.has(grade) ? [byGrade.get(grade)!] : []);
}

export function gradeAPrice(prices: InsightMarketPrice[]): number | null {
  return prices.find(p => p.grade === 'A')?.price_per_kg ?? null;
}
