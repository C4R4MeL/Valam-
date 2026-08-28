import { Test, TestingModule } from '@nestjs/testing';
import { RfqService, SubmitRfqDto, RespondRfqDto } from './rfq.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

const mockPrismaService = {
  rfqRequest: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  rfqResponse: {
    create: jest.fn(),
  },
};

describe('RfqService', () => {
  let service: RfqService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RfqService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<RfqService>(RfqService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitRfq', () => {
    it('should create a new RFQ request', async () => {
      const buyerId = 'buyer-1';
      const dto: SubmitRfqDto = {
        supplier_id: 'supplier-1',
        volume_kg: 50,
        budget_per_kg: 800000,
        min_pa_percentage: 30,
        max_moisture: 5,
        notes: 'Need this ASAP'
      };

      const mockCreatedRfq = {
        id: 'rfq-id-1',
        ...dto,
        buyer_id: buyerId,
        status: 'SENT',
      };

      mockPrismaService.rfqRequest.create.mockResolvedValue(mockCreatedRfq);

      const result = await service.submitRfq(buyerId, dto);
      expect(result).toEqual(mockCreatedRfq);
      expect(mockPrismaService.rfqRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            buyer_id: buyerId,
            supplier_id: dto.supplier_id,
            status: 'SENT',
          })
        })
      );
    });
  });

  describe('respondToRfq', () => {
    it('should throw NotFoundException if RFQ not found', async () => {
      mockPrismaService.rfqRequest.findUnique.mockResolvedValue(null);

      const dto: RespondRfqDto = {
        proposed_price_per_kg: 850000,
        proposed_volume_kg: 50,
        action: 'COUNTER'
      };

      await expect(service.respondToRfq('supp-1', 'invalid-id', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if supplier does not own RFQ', async () => {
      mockPrismaService.rfqRequest.findUnique.mockResolvedValue({
        id: 'rfq-1',
        supplier_id: 'other-supp',
        status: 'SENT'
      });

      const dto: RespondRfqDto = {
        proposed_price_per_kg: 850000,
        proposed_volume_kg: 50,
        action: 'ACCEPT'
      };

      await expect(service.respondToRfq('supp-1', 'rfq-1', dto)).rejects.toThrow(ForbiddenException);
    });

    it('should create a response and update RFQ status', async () => {
      mockPrismaService.rfqRequest.findUnique.mockResolvedValue({
        id: 'rfq-1',
        supplier_id: 'supp-1',
        status: 'SENT'
      });

      mockPrismaService.rfqResponse.create.mockResolvedValue({ id: 'resp-1' });
      mockPrismaService.rfqRequest.update.mockResolvedValue({ id: 'rfq-1', status: 'ACCEPTED' });

      const dto: RespondRfqDto = {
        proposed_price_per_kg: 850000,
        proposed_volume_kg: 50,
        action: 'ACCEPT'
      };

      const result = await service.respondToRfq('supp-1', 'rfq-1', dto);

      expect(mockPrismaService.rfqResponse.create).toHaveBeenCalled();
      expect(mockPrismaService.rfqRequest.update).toHaveBeenCalledWith({
        where: { id: 'rfq-1' },
        data: { status: 'ACCEPTED' }
      });
      expect(result).toHaveProperty('id', 'resp-1');
    });
  });
});
