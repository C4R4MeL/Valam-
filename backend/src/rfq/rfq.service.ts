import { PUBLIC_USER_SELECT } from '../users/public-user.select';
import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommerceService, rupiah } from '../commerce/commerce.service';
import { IsString, IsNumber, IsOptional, IsIn, IsUUID, IsDateString, Min, Max, ValidateIf, MaxLength } from 'class-validator';
import { randomUUID } from 'node:crypto';

export class SubmitRfqDto {
  @IsUUID() supplier_id: string;
  @IsNumber() @Min(0.001) volume_kg: number;
  @IsNumber() @Min(1) budget_per_kg: number;
  @IsNumber() @Min(0) @Max(100) min_pa_percentage: number;
  @IsNumber() @Min(0) @Max(100) max_moisture: number;
  @IsString() @IsOptional() @MaxLength(10000) notes?: string;
}
export class RespondRfqDto {
  @ValidateIf(o => o.action !== 'REJECT') @IsUUID() product_id?: string;
  @ValidateIf(o => o.action !== 'REJECT') @IsDateString() expires_at?: string;
  @ValidateIf(o => o.action !== 'REJECT') @IsNumber() @Min(1) proposed_price_per_kg: number;
  @ValidateIf(o => o.action !== 'REJECT') @IsNumber() @Min(0.001) proposed_volume_kg: number;
  @IsString() @IsOptional() @MaxLength(10000) message?: string;
  @IsIn(['ACCEPT', 'COUNTER', 'REJECT']) action: 'ACCEPT' | 'COUNTER' | 'REJECT';
}
export class CloseRfqDto {
  @IsIn(['ACCEPTED', 'REJECTED']) status: 'ACCEPTED' | 'REJECTED';
}

@Injectable()
export class RfqService {
  constructor(private readonly prisma: PrismaService, private readonly commerce: CommerceService) {}

  async submitRfq(buyerId: string, dto: SubmitRfqDto) {
    const supplier = await this.prisma.user.findUnique({ where: { id: dto.supplier_id }, include: { role: true } });
    if (!supplier || supplier.role.name !== 'supplier' || supplier.status !== 'active') throw new BadRequestException('Pilih pemasok aktif yang sebenarnya');
    return this.prisma.rfqRequest.create({ data: { ...dto, rfq_number: 'RFQ-' + randomUUID(), buyer_id: buyerId, status: 'SENT' } });
  }

  getBuyerRfqs(buyerId: string) {
    return this.prisma.rfqRequest.findMany({ where: { buyer_id: buyerId },
      include: { supplier: { select: PUBLIC_USER_SELECT }, response: { include: { product: { select: { id: true, batch_code: true, is_demo: true } } } }, order: { select: { id: true, order_number: true, status: true } } }, orderBy: { created_at: 'desc' } });
  }
  getSupplierRfqs(supplierId: string) {
    return this.prisma.rfqRequest.findMany({ where: { supplier_id: supplierId },
      include: { buyer: { select: PUBLIC_USER_SELECT }, response: { include: { product: { select: { id: true, batch_code: true } } } }, order: { select: { id: true, order_number: true } } }, orderBy: { created_at: 'desc' } });
  }

  async respondToRfq(supplierId: string, rfqId: string, dto: RespondRfqDto) {
    return this.prisma.$transaction(async tx => {
      await this.commerce.lock(tx, 'rfq:' + rfqId);
      const rfq = await tx.rfqRequest.findUnique({ where: { id: rfqId }, include: { response: true } });
      if (!rfq) throw new NotFoundException('RFQ not found');
      if (rfq.supplier_id !== supplierId) throw new ForbiddenException('Not your RFQ');
      if (rfq.status !== 'SENT') throw new ConflictException('RFQ sudah mendapat respons atau telah ditutup');
      let expiry: Date | null = null;
      if (dto.action !== 'REJECT') {
        expiry = new Date(dto.expires_at || '');
        if (!dto.product_id || !Number.isFinite(expiry.getTime()) || expiry <= new Date() || expiry.getTime() > Date.now() + 30 * 86400000 || !Number.isFinite(dto.proposed_price_per_kg) || dto.proposed_price_per_kg <= 0 || !Number.isFinite(dto.proposed_volume_kg) || dto.proposed_volume_kg <= 0) throw new BadRequestException('Batch, masa berlaku, harga dan volume wajib valid');
        const batch = await tx.product.findUnique({ where: { id: dto.product_id } });
        if (!batch || batch.supplier_id !== supplierId || batch.status !== 'VERIFIED') throw new BadRequestException('Batch penawaran tidak dimiliki pemasok atau tidak tersedia');
        if (dto.proposed_volume_kg > batch.available_volume_kg || dto.proposed_volume_kg < batch.moq_kg) throw new BadRequestException('Volume penawaran melanggar stok atau MOQ');
      }
      const status = dto.action === 'REJECT' ? 'REJECTED' : dto.action === 'COUNTER' ? 'COUNTER_OFFER' : 'OFFERED';
      const response = await tx.rfqResponse.create({ data: { rfq_id: rfqId, supplier_id: supplierId,
        product_id: dto.action === 'REJECT' ? null : dto.product_id, expires_at: expiry,
        proposed_price_per_kg: dto.action === 'REJECT' ? rfq.budget_per_kg : dto.proposed_price_per_kg,
        proposed_volume_kg: dto.action === 'REJECT' ? rfq.volume_kg : dto.proposed_volume_kg,
        message: dto.message, status } });
      await tx.rfqRequest.update({ where: { id: rfqId }, data: { status } });
      return response;
    }, { timeout: 30000, maxWait: 10000 });
  }

  async closeRfq(buyerId: string, rfqId: string, status: 'ACCEPTED' | 'REJECTED') {
    if (!['ACCEPTED', 'REJECTED'].includes(status)) throw new BadRequestException('Status penutupan RFQ tidak valid');
    return this.prisma.$transaction(async tx => {
      await this.commerce.lock(tx, 'rfq:' + rfqId);
      const rfq = await tx.rfqRequest.findUnique({ where: { id: rfqId }, include: { response: true, order: true, buyer: { select: { profile: true } } } });
      if (!rfq) throw new NotFoundException('RFQ not found');
      if (rfq.buyer_id !== buyerId) throw new ForbiddenException('Not your RFQ');
      if (rfq.status === 'ACCEPTED' && rfq.order && status === 'ACCEPTED') return { ...rfq, order: rfq.order };
      if (rfq.status === 'ACCEPTED') throw new ConflictException('RFQ sudah menjadi pesanan');
      if (status === 'REJECTED') {
        if (rfq.status === 'REJECTED') return rfq;
        return tx.rfqRequest.update({ where: { id: rfqId }, data: { status } });
      }
      const offer = rfq.response;
      if (!['OFFERED', 'COUNTER_OFFER'].includes(rfq.status) || !offer?.product_id || !offer.expires_at || offer.expires_at <= new Date()) throw new BadRequestException('Penawaran belum lengkap atau kedaluwarsa');
      const line = { product_id: offer.product_id, circular_product_id: null, quantity_kg: offer.proposed_volume_kg, price_per_kg: offer.proposed_price_per_kg };
      await this.commerce.reserve(tx, [line], rfq.supplier_id);
      const amount = rupiah(line.quantity_kg * line.price_per_kg);
      const profile = rfq.buyer.profile;
      const order = await tx.order.create({ data: { rfq_id: rfq.id, order_number: 'ORD-RFQ-' + randomUUID(), buyer_id: buyerId, supplier_id: rfq.supplier_id,
        total_amount: amount, status: 'PENDING', payment_status: 'pending', stock_state: 'RESERVED',
        reservation_expires_at: new Date(Math.min(offer.expires_at.getTime(), Date.now() + 30 * 60000)),
        shipping_address: { checkout_mode: 'rfq', offer_id: offer.id, address: profile?.address || '', postal_code: profile?.postal_code || null, area_id: profile?.area_id || null, contact_name: profile?.contact_person || null, phone: profile?.phone || null },
        items: { create: { ...line, subtotal: amount } }, payment: { create: { amount, status: 'pending' } },
      } });
      const updated = await tx.rfqRequest.update({ where: { id: rfqId }, data: { status: 'ACCEPTED' } });
      return { ...updated, order };
    }, { timeout: 30000, maxWait: 10000 });
  }
}
