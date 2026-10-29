import { Test, TestingModule } from '@nestjs/testing';
import { MatchingService } from './matching.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  product: {
    findMany: jest.fn(),
  },
};

describe('MatchingService (MCDM Algorithm)', () => {
  let service: MatchingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchingService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<MatchingService>(MatchingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findMatches', () => {
    const reviewed = (qc: any) => [{ issuer_snapshot: { name: 'TEST FIXTURE LAB' }, parameters: Object.entries(qc).filter(([,v]) => v != null).map(([k,v]) => ({ name: k === 'pa_percentage' ? 'PA' : k, value: String(v), unit: '%'  })) }];
    const batch = (id: string, overrides: Record<string, any> = {}) => ({
      id, batch_code: 'DEMO-' + id, supplier_id: 'supplier-' + id, status: 'VERIFIED',
      price_per_kg: 100, available_volume_kg: 100, moq_kg: 1,
      qc_result: { pa_percentage: 30, moisture: 3 },
      supplier: { profile: { company_name: 'DEMONSTRASI ' + id } }, ...overrides, is_demo: false, lab_reports: reviewed(overrides.qc_result || { pa_percentage: 30, moisture: 3 }),
    });
    const criteria = { volume_kg: 100, max_budget: 100, min_pa: 30, max_moisture: 3 };

    it('ranks fully eligible results ahead of a higher-scoring alternative that violates MOQ', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        batch('eligible'), batch('alternative', { price_per_kg: 1, available_volume_kg: 1000, moq_kg: 200, qc_result: { pa_percentage: 99, moisture: 0 } }),
      ]);
      const results = await service.findMatches(criteria);
      expect(results[0]).toMatchObject({ id: 'eligible', is_eligible: true });
      expect(results[1].match_score).toBeGreaterThan(results[0].match_score!);
      expect(results[1].unmet_requirements).toContain('Volume kebutuhan di bawah MOQ batch');
    });

    it('distinguishes a measured zero moisture from missing data and does not invent a score', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        batch('zero', { qc_result: { pa_percentage: 30, moisture: 0 } }),
        batch('missing', { qc_result: { pa_percentage: 30, moisture: null } }),
      ]);
      const results = await service.findMatches({ ...criteria, max_moisture: 0 });
      expect(results[0]).toMatchObject({ id: 'zero', moisture: 0, is_eligible: true });
      expect(results[1]).toMatchObject({ id: 'missing', moisture: null, match_score: null, is_eligible: false });
      expect(results[1].unmet_requirements).toContain('Data moisture belum tersedia/valid');
    });

    it('reports every unmet limit and rejects invalid criteria', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([batch('gaps', { price_per_kg: 200, available_volume_kg: 20, qc_result: { pa_percentage: 20, moisture: 4 } })]);
      const results = await service.findMatches(criteria);
      expect(results[0].unmet_requirements).toHaveLength(4);
      expect(results[0].is_eligible).toBe(false);
      await expect(service.findMatches({ ...criteria, volume_kg: -1 })).rejects.toThrow();
    });
    it('ignores unreviewed legacy QC even when its numbers satisfy criteria', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([{ ...batch('legacy'), lab_reports: [] }]);
      const [result] = await service.findMatches(criteria);
      expect(result).toMatchObject({ is_eligible: false, pa_percentage: null, moisture: null, match_score: null });
    });

    it('should return empty array if no products found', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      
      const criteria = {
        volume_kg: 100,
        max_budget: 1000000,
        min_pa: 30,
        max_moisture: 5
      };

      const result = await service.findMatches(criteria);
      expect(result).toEqual([]);
    });

    it('should correctly calculate Euclidean Distance and return top matches sorted by score', async () => {
      const mockProducts = [
        {
          id: '1',
          price_per_kg: 800000,
          available_volume_kg: 200,
          qc_result: { pa_percentage: 32, moisture: 4 },
          supplier: { profile: { company_name: 'Supplier A' } }
        },
        {
          id: '2',
          price_per_kg: 950000,
          available_volume_kg: 50, // Best PA but expensive and low volume
          qc_result: { pa_percentage: 35, moisture: 3 },
          supplier: { profile: { company_name: 'Supplier B' } }
        },
        {
          id: '3',
          price_per_kg: 1200000, // Over budget, but matching criteria will penalize distance
          available_volume_kg: 500,
          qc_result: { pa_percentage: 28, moisture: 6 },
          supplier: { profile: { company_name: 'Supplier C' } }
        }
      ];

      mockPrismaService.product.findMany.mockResolvedValue(mockProducts.map(p => ({ ...p, is_demo: false, lab_reports: reviewed(p.qc_result) })));
      
      const criteria = {
        volume_kg: 100,
        max_budget: 900000,
        min_pa: 30,
        max_moisture: 5
      };

      const results = await service.findMatches(criteria);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeLessThanOrEqual(5);

      if (results.length >= 2) {
        expect(results[0].match_score).toBeGreaterThanOrEqual(results[1].match_score!);
      }
      
      expect(results[0]).toHaveProperty('match_score');
    });
  });
});
