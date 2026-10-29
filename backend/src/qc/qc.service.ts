import { Injectable, NotFoundException, GoneException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecordQcDto } from './qc.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class QcService {
  constructor(private readonly prisma: PrismaService) {}

  async createQcResult(batchId: string, adminId: string, data: RecordQcDto) {
    return this.prisma.$transaction(
      async (tx) => {
        const product = await tx.product.findUnique({ where: { id: batchId } });
        if (!product) throw new NotFoundException('Product not found');
        const values = {
          admin_id: adminId,
          pa_percentage: data.pa_percentage ?? null,
          moisture: data.moisture ?? null,
          specific_gravity: data.specific_gravity ?? null,
          refractive_index: data.refractive_index ?? null,
          optical_rotation: data.optical_rotation ?? null,
          lab_name: data.lab_name || null,
          report_number: data.report_number || null,
          source_document_url: data.source_document_url || null,
          tested_at: data.tested_at ? new Date(data.tested_at) : null,
          lab_notes: data.lab_notes || null,
          overall_status: 'UNEVALUATED',
          evaluation_rule_version: null,
        };
        const previous = await tx.qcResult.findUnique({
          where: { product_id: batchId },
        });
        const before = previous
          ? Object.fromEntries(
              Object.keys(values).map((key) => [
                key,
                previous[key as keyof typeof previous] ?? null,
              ]),
            )
          : null;
        if (previous && JSON.stringify(before) === JSON.stringify(values))
          return { qcResult: previous, cert: null };
        await tx.qualityEvent.create({
          data: {
            actor_id: adminId,
            actor_role: 'admin',
            action: 'LEGACY_QC_RECORDED',
            notes: JSON.stringify({
              product_id: batchId,
              before,
              after: values,
            }),
            action_key: `legacy:${randomUUID()}`,
          },
        });
        const qcResult = await tx.qcResult.upsert({
          where: { product_id: batchId },
          update: values,
          create: { product_id: batchId, ...values },
        });
        if (['DRAFT', 'IN_LAB'].includes(product.status))
          await tx.product.update({
            where: { id: batchId },
            data: { status: 'AWAITING_PRICE' },
          });
        await tx.traceLog.create({
          data: {
            product_id: batchId,
            event_type: 'QC_RECORDED',
            location_name: data.lab_name || 'Laboratorium belum diinformasikan',
            description:
              'Data pengujian dicatat; belum dievaluasi. Tidak ada sertifikat atau klaim kelulusan otomatis.',
          },
        });
        return { qcResult, cert: null };
      },
      { timeout: 15000, maxWait: 10000 },
    );
  }

  async receiveSample(_batchId: string) {
    throw new GoneException(
      'Record sample receipt through the testing request workflow with partner confirmation.',
    );
  }

  async getDigitalCoa(_productId: string): Promise<any> {
    throw new NotFoundException(
      'Legacy certificates need provenance review. Use reviewed laboratory source documents in the quality workflow.',
    );
  }

  async generatePdf(_productId: string): Promise<Buffer> {
    throw new NotFoundException(
      'VALAM does not generate laboratory CoA documents. Download the original reviewed source document.',
    );
  }
}
