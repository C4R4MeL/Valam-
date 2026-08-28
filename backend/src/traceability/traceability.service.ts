import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as QRCode from 'qrcode';

@Injectable()
export class TraceabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getTraceabilityInfo(batchId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: batchId },
      include: {
        supplier: {
          include: { profile: true },
        },
        trace_logs: {
          orderBy: { event_date: 'asc' },
        },
        qc_result: true,
        certificate: true,
      },
    });

    if (!product) throw new NotFoundException('Product batch not found');

    return product;
  }

  async getTraceabilityInfoByBatchCode(batchCode: string) {
    const product = await this.prisma.product.findUnique({
      where: { batch_code: batchCode },
      include: {
        supplier: {
          include: { profile: true },
        },
        trace_logs: {
          orderBy: { event_date: 'asc' },
        },
        qc_result: true,
        certificate: true,
      },
    });

    if (!product) throw new NotFoundException('Product batch not found');

    return product;
  }

  async generateTraceQrCode(batchId: string): Promise<Buffer> {
    const qrUrl = `https://valam.id/traceability/${batchId}`;
    return QRCode.toBuffer(qrUrl);
  }
}
