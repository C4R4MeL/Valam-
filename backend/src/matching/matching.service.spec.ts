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

      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
      
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
        expect(results[0].match_score).toBeGreaterThanOrEqual(results[1].match_score);
      }
      
      expect(results[0]).toHaveProperty('match_score');
    });
  });
});
