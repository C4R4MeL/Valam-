import { Injectable, BadRequestException } from '@nestjs/common';
import { IsNumber, Min, Max } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { publicQuality, reviewedReportSelection } from '../quality/quality.public';

export class MatchingCriteriaDto {
  @IsNumber() @Min(0.001) volume_kg: number;
  @IsNumber() @Min(1) max_budget: number;
  @IsNumber() @Min(0) @Max(100) min_pa: number;
  @IsNumber() @Min(0) @Max(100) max_moisture: number;
}
export const MATCHING_ALGORITHM = 'MCDM: weighted Euclidean distance to the ideal point';
const WEIGHTS = { pa: 0.4, price: 0.3, moisture: 0.15, volume: 0.15 };
const numeric = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) ? value : null;

@Injectable()
export class MatchingService {
  constructor(private readonly prisma: PrismaService) {}

  async findMatches(criteria: MatchingCriteriaDto) {
    if (!Number.isFinite(criteria.volume_kg) || criteria.volume_kg <= 0 || !Number.isFinite(criteria.max_budget) || criteria.max_budget <= 0 ||
        !Number.isFinite(criteria.min_pa) || criteria.min_pa < 0 || criteria.min_pa > 100 || !Number.isFinite(criteria.max_moisture) || criteria.max_moisture < 0 || criteria.max_moisture > 100) throw new BadRequestException('Kriteria matching tidak valid');
    const products = await this.prisma.product.findMany({ where: { status: 'VERIFIED' }, include: { supplier: { include: { profile: true, supplier_profile: true } }, qc_result: true, lab_reports: reviewedReportSelection } });
    const values = products.map(p => { const quality = publicQuality(p); return { product: p, pa: numeric(quality.pa_percentage), moisture: numeric(quality.moisture), price: numeric(p.price_per_kg), volume: numeric(p.available_volume_kg) }; });
    const complete = values.filter(p => p.pa !== null && p.pa >= 0 && p.pa <= 100 && p.moisture !== null && p.moisture >= 0 && p.moisture <= 100 && p.price !== null && p.price > 0 && p.volume !== null && p.volume >= 0);
    const ranges = Object.fromEntries((['pa', 'price', 'moisture', 'volume'] as const).map(key => [key, { min: Math.min(...complete.map(p => p[key]!)), max: Math.max(...complete.map(p => p[key]!)) }])) as Record<keyof typeof WEIGHTS, { min: number; max: number }>;
    const result = values.map(value => {
      const { product: p, pa, moisture, price, volume } = value;
      const unmet: string[] = [], met: string[] = [];
      const check = (valid: boolean, condition: boolean, pass: string, fail: string, missing: string) => { if (!valid) unmet.push(missing); else if (condition) met.push(pass); else unmet.push(fail); };
      check(pa !== null && pa >= 0 && pa <= 100, pa !== null && pa >= criteria.min_pa, 'PA memenuhi batas minimum tercatat', 'PA di bawah kebutuhan', 'Data PA belum tersedia/valid');
      check(moisture !== null && moisture >= 0 && moisture <= 100, moisture !== null && moisture <= criteria.max_moisture, 'Moisture memenuhi batas maksimum tercatat', 'Moisture melebihi kebutuhan', 'Data moisture belum tersedia/valid');
      check(price !== null && price > 0, price !== null && price <= criteria.max_budget, 'Harga dalam anggaran per kg', 'Harga melebihi anggaran per kg', 'Harga penawaran belum tersedia/valid');
      check(volume !== null && volume >= 0, volume !== null && volume >= criteria.volume_kg, 'Stok mencukupi volume kebutuhan', 'Stok tidak mencukupi', 'Data stok belum tersedia/valid');
      if (criteria.volume_kg < p.moq_kg) unmet.push('Volume kebutuhan di bawah MOQ batch');
      let score: number | null = null;
      if (complete.includes(value)) {
        let squaredDistance = 0;
        for (const key of ['pa', 'price', 'moisture', 'volume'] as const) {
          const range = ranges[key];
          const normal = range.max === range.min ? 1 : key === 'price' || key === 'moisture' ? (range.max - value[key]!) / (range.max - range.min) : (value[key]! - range.min) / (range.max - range.min);
          squaredDistance += WEIGHTS[key] * (1 - normal) ** 2;
        }
        score = Math.round(Math.max(0, Math.min(100, (1 - Math.sqrt(squaredDistance)) * 100)));
      }
      return { id: p.id, batch_code: p.batch_code, supplier_id: p.supplier_id,
        supplier_name: p.supplier.supplier_profile?.nama_koperasi || p.supplier.profile?.company_name || 'Supplier',
        supplier_contact: p.supplier.supplier_profile?.whatsapp || p.supplier.profile?.phone || null,
        origin_district: p.origin_district, is_demo: p.is_demo, pa_percentage: pa, moisture, price_per_kg: price, available_volume_kg: volume,
        moq_kg: p.moq_kg, match_score: score, is_eligible: unmet.length === 0,
        met_requirements: met, unmet_requirements: unmet, quality_status: 'UNEVALUATED',
        explanation: 'Kecocokan berdasarkan angka tercatat; bukan bukti kelulusan atau validasi laboratorium.',
      };
    });
    result.sort((a, b) => Number(b.is_eligible) - Number(a.is_eligible) || (b.match_score ?? -1) - (a.match_score ?? -1) || a.id.localeCompare(b.id));
    // Both groups get a bounded list; alternatives never displace a fully eligible match.
    return [...result.filter(p => p.is_eligible).slice(0, 5), ...result.filter(p => !p.is_eligible).slice(0, 5)];
  }
}
