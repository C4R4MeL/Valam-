import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class QcService {
  constructor(private readonly prisma: PrismaService) {}

  async createQcResult(batchId: string, adminId: string, data: any) {
    const product = await this.prisma.product.findUnique({
      where: { id: batchId },
    });

    if (!product) throw new NotFoundException('Product not found');

    // Resolve a real admin ID from the database to prevent foreign key violation
    let realAdminId = adminId;
    const dbAdmin = await this.prisma.user.findFirst({
      where: { role: { name: 'admin' } },
    });
    if (dbAdmin) {
      realAdminId = dbAdmin.id;
    } else {
      const anyUser = await this.prisma.user.findFirst();
      if (anyUser) {
        realAdminId = anyUser.id;
      }
    }

    const qcResult = await this.prisma.qcResult.create({
      data: {
        product_id: batchId,
        admin_id: realAdminId,
        pa_percentage: data.pa_percentage,
        moisture: data.moisture,
        specific_gravity: data.specific_gravity,
        refractive_index: data.refractive_index,
        optical_rotation: data.optical_rotation,
        overall_status: 'pass',
        lab_notes: data.lab_notes || '',
      },
    });

    // Generate Certificate
    const certificateNumber = `COA-${product.batch_code}-${Date.now()}`;
    const cert = await this.prisma.certificate.create({
      data: {
        product_id: batchId,
        qc_result_id: qcResult.id,
        certificate_number: certificateNumber,
        admin_name: 'Admin Valam QC', // This should be queried from adminId in real app
      },
    });

    // Update Product Status to AWAITING_PRICE so supplier can set price
    await this.prisma.product.update({
      where: { id: batchId },
      data: { status: 'AWAITING_PRICE' },
    });

    // Create Trace Log
    await this.prisma.traceLog.create({
      data: {
        product_id: batchId,
        event_type: 'LAB_VERIFIED',
        location_name: 'Valam Central QC Hub',
        description: 'Produk telah lulus uji laboratorium dan disertifikasi',
      },
    });

    // In a real app we'd trigger async PDF generation and save to cloud.
    // For now we can generate it when requested.
    
    return { qcResult, cert };
  }

  async receiveSample(batchId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: batchId },
    });

    if (!product) throw new NotFoundException('Product not found');

    const updated = await this.prisma.product.update({
      where: { id: batchId },
      data: { status: 'IN_LAB' },
    });

    // Create Trace Log for receiving sample
    await this.prisma.traceLog.create({
      data: {
        product_id: batchId,
        event_type: 'IN_LAB',
        location_name: 'Valam Central QC Hub',
        description: 'Sampel fisik telah diterima di laboratorium dan sedang dalam proses pengujian GC-MS',
      },
    });

    return updated;
  }

  async getDigitalCoa(productId: string) {
    const coa = await this.prisma.certificate.findUnique({
      where: { product_id: productId },
      include: {
        qc_result: true,
        product: {
          include: {
            supplier: {
              include: { profile: true }
            }
          }
        }
      },
    });

    if (!coa) throw new NotFoundException('CoA not found for this product');
    return coa;
  }

  async generatePdf(productId: string): Promise<Buffer> {
    const coa = await this.getDigitalCoa(productId);

    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Generate QR code buffer
        const qrUrl = `https://valam.id/traceability/${productId}`;
        const qrImageBuffer = await QRCode.toBuffer(qrUrl);

        // Build PDF
        doc.fontSize(20).text('CERTIFICATE OF ANALYSIS (CoA)', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Certificate Number: ${coa.certificate_number}`);
        doc.text(`Issue Date: ${coa.issued_at.toISOString().split('T')[0]}`);
        doc.moveDown();

        doc.fontSize(14).text('Product Information', { underline: true });
        doc.fontSize(12).text(`Batch Code: ${coa.product.batch_code}`);
        doc.text(`Supplier: ${coa.product.supplier.profile?.company_name || 'N/A'}`);
        doc.moveDown();

        doc.fontSize(14).text('Laboratory Results', { underline: true });
        doc.fontSize(12);
        doc.text(`Patchouli Alcohol (PA): ${coa.qc_result.pa_percentage}%`);
        doc.text(`Moisture Content: ${coa.qc_result.moisture}%`);
        doc.text(`Specific Gravity: ${coa.qc_result.specific_gravity}`);
        doc.text(`Refractive Index: ${coa.qc_result.refractive_index}`);
        doc.text(`Optical Rotation: ${coa.qc_result.optical_rotation}`);
        doc.moveDown();

        doc.text(`Status: ${coa.qc_result.overall_status.toUpperCase()}`);
        doc.moveDown(2);

        doc.text(`Authorized by: ${coa.admin_name}`);
        
        // Add QR
        doc.image(qrImageBuffer, doc.page.width - 150, doc.page.height - 150, { width: 100 });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
