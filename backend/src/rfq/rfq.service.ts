import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsString, IsNumber, IsOptional, IsEnum, IsUUID } from 'class-validator';

export class SubmitRfqDto {
  @IsUUID()
  supplier_id: string;

  @IsNumber()
  volume_kg: number;

  @IsNumber()
  budget_per_kg: number;

  @IsNumber()
  min_pa_percentage: number;

  @IsNumber()
  max_moisture: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class RespondRfqDto {
  @IsNumber()
  proposed_price_per_kg: number;

  @IsNumber()
  proposed_volume_kg: number;

  @IsString()
  @IsOptional()
  message?: string;

  @IsEnum(['ACCEPT', 'COUNTER', 'REJECT'])
  action: 'ACCEPT' | 'COUNTER' | 'REJECT';
}

@Injectable()
export class RfqService {
  constructor(private prisma: PrismaService) {}

  async submitRfq(buyerId: string, dto: SubmitRfqDto) {
    const rfqNumber = 'RFQ-' + Date.now().toString();
    
    return this.prisma.rfqRequest.create({
      data: {
        rfq_number: rfqNumber,
        buyer_id: buyerId,
        supplier_id: dto.supplier_id,
        volume_kg: dto.volume_kg,
        budget_per_kg: dto.budget_per_kg,
        min_pa_percentage: dto.min_pa_percentage,
        max_moisture: dto.max_moisture,
        notes: dto.notes,
        status: 'SENT'
      }
    });
  }

  async getBuyerRfqs(buyerId: string) {
    return this.prisma.rfqRequest.findMany({
      where: { buyer_id: buyerId },
      include: {
        supplier: { include: { profile: true, supplier_profile: true } },
        response: true
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async getSupplierRfqs(supplierId: string) {
    return this.prisma.rfqRequest.findMany({
      where: { supplier_id: supplierId },
      include: {
        buyer: { include: { profile: true } },
        response: true
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async respondToRfq(supplierId: string, rfqId: string, dto: RespondRfqDto) {
    const rfq = await this.prisma.rfqRequest.findUnique({
      where: { id: rfqId }
    });

    if (!rfq) throw new NotFoundException('RFQ not found');
    if (rfq.supplier_id !== supplierId) throw new ForbiddenException('Not your RFQ');
    if (rfq.status !== 'SENT') throw new BadRequestException('RFQ already responded');

    const newStatus = dto.action === 'ACCEPT' ? 'ACCEPTED' : 
                      dto.action === 'REJECT' ? 'REJECTED' : 'COUNTER_OFFER';

    // Update RFQ status
    await this.prisma.rfqRequest.update({
      where: { id: rfqId },
      data: { status: newStatus }
    });

    // Create Response
    return this.prisma.rfqResponse.create({
      data: {
        rfq_id: rfqId,
        supplier_id: supplierId,
        proposed_price_per_kg: dto.proposed_price_per_kg,
        proposed_volume_kg: dto.proposed_volume_kg,
        message: dto.message,
        status: newStatus
      }
    });
  }

  async closeRfq(buyerId: string, rfqId: string, status: 'ACCEPTED' | 'REJECTED') {
    const rfq = await this.prisma.rfqRequest.findUnique({
      where: { id: rfqId },
      include: { response: true }
    });

    if (!rfq) throw new NotFoundException('RFQ not found');
    if (rfq.buyer_id !== buyerId) throw new ForbiddenException('Not your RFQ');
    
    // Update RFQ status
    const updated = await this.prisma.rfqRequest.update({
      where: { id: rfqId },
      data: { status }
    });

    // If accepted and has response, create a real Order in the system
    if (status === 'ACCEPTED' && rfq.response) {
      // Find or create product
      let product = await this.prisma.product.findFirst({
        where: { supplier_id: rfq.supplier_id }
      });

      if (!product) {
        product = await this.prisma.product.create({
          data: {
            supplier_id: rfq.supplier_id,
            batch_code: 'BATCH-RFQ-' + Date.now().toString().slice(-6),
            total_volume_kg: rfq.response.proposed_volume_kg,
            available_volume_kg: 0, // All goes to the RFQ order
            price_per_kg: rfq.response.proposed_price_per_kg,
            status: 'VERIFIED'
          }
        });
      } else {
        // Decrement available volume of the matched product
        await this.prisma.product.update({
          where: { id: product.id },
          data: {
            available_volume_kg: {
              decrement: rfq.response.proposed_volume_kg
            }
          }
        });
      }

      const totalAmount = rfq.response.proposed_volume_kg * rfq.response.proposed_price_per_kg;

      // Create Order
      const order = await this.prisma.order.create({
        data: {
          order_number: 'ORD-RFQ-' + Date.now().toString().slice(-8),
          buyer_id: buyerId,
          supplier_id: rfq.supplier_id,
          total_amount: totalAmount,
          status: 'UNPAID',
          items: {
            create: [{
              product_id: product.id,
              quantity_kg: rfq.response.proposed_volume_kg,
              price_per_kg: rfq.response.proposed_price_per_kg,
              subtotal: totalAmount
            }]
          }
        }
      });

      // Create Payment record
      await this.prisma.payment.create({
        data: {
          order_id: order.id,
          amount: totalAmount,
          status: 'pending'
        }
      });
    }

    return updated;
  }
}
