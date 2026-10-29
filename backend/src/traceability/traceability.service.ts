import { publicQuality, reviewedReportSelection } from '../quality/quality.public';
import { PUBLIC_USER_SELECT } from '../users/public-user.select';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as QRCode from 'qrcode';

@Injectable()
export class TraceabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getTraceabilityInfo(batchId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: batchId, status: 'VERIFIED' },
      include: {
        supplier: { select: PUBLIC_USER_SELECT },
        trace_logs: {
          orderBy: { event_date: 'asc' },
        },
        qc_result: true,
        lab_reports: reviewedReportSelection,
      },
    });

    if (!product) throw new NotFoundException('Product batch not found');

    const { qc_result, lab_reports, ...publicProduct } = product;
    return { ...publicProduct, ...publicQuality(product), certificate: null };
  }

  async getTraceabilityInfoByBatchCode(batchCode: string) {
    const product = await this.prisma.product.findUnique({
      where: { batch_code: batchCode, status: 'VERIFIED' },
      include: {
        supplier: { select: PUBLIC_USER_SELECT },
        trace_logs: {
          orderBy: { event_date: 'asc' },
        },
        qc_result: true,
        lab_reports: reviewedReportSelection,
      },
    });

    if (!product) throw new NotFoundException('Product batch not found');

    const { qc_result, lab_reports, ...publicProduct } = product;
    return { ...publicProduct, ...publicQuality(product), certificate: null };
  }

  async generateTraceQrCode(batchId: string): Promise<Buffer> {
    const product = await this.prisma.product.findFirst({ where: { id: batchId, status: 'VERIFIED' } });
    if (!product) throw new NotFoundException('Published batch not found');
    const base = process.env.PUBLIC_APP_URL || process.env.FRONTEND_URL;
    if (!base) throw new BadRequestException('Public website URL has not been configured');
    const url = new URL(base);
    if (!['http:', 'https:'].includes(url.protocol)) throw new BadRequestException('Invalid public website URL');
    const locale = process.env.PUBLIC_DEFAULT_LOCALE === 'en' ? 'en' : 'id';
    const qrUrl = new URL(`/${locale}/traceability/${encodeURIComponent(product.batch_code)}`, url).toString();
    return QRCode.toBuffer(qrUrl);
  }
}
