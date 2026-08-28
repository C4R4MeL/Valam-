import { Injectable, Logger } from '@nestjs/common';
import { SupplierProfile, SupplierDocument } from '@prisma/client';

/**
 * Notification Service — method stubs for future implementation.
 * Currently logs to console. Replace with email/WhatsApp/push integration later.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  async sendRegistrationConfirmation(supplier: SupplierProfile): Promise<void> {
    this.logger.log(`[STUB] Registration confirmation → ${supplier.nama_koperasi} (${supplier.whatsapp})`);
  }

  async sendDocumentSubmittedToAdmin(supplier: SupplierProfile): Promise<void> {
    this.logger.log(`[STUB] Document submitted notification to admin → supplier: ${supplier.nama_koperasi}`);
  }

  async sendVerificationApproved(supplier: SupplierProfile): Promise<void> {
    this.logger.log(`[STUB] Verification approved → ${supplier.nama_koperasi}`);
  }

  async sendDocumentRejected(supplier: SupplierProfile, document: SupplierDocument, catatan: string): Promise<void> {
    this.logger.log(`[STUB] Document rejected → ${supplier.nama_koperasi}, doc: ${document.tipe_document}, catatan: ${catatan}`);
  }

  async sendRevisionRequested(supplier: SupplierProfile, document: SupplierDocument, catatan: string): Promise<void> {
    this.logger.log(`[STUB] Revision requested → ${supplier.nama_koperasi}, doc: ${document.tipe_document}, catatan: ${catatan}`);
  }

  async sendLegacyMigrationNotice(supplier: SupplierProfile, deadline: Date): Promise<void> {
    this.logger.log(`[STUB] Legacy migration notice → ${supplier.nama_koperasi}, deadline: ${deadline.toISOString()}`);
  }

  async sendLegacyDeadlineReminder(supplier: SupplierProfile, sisaHari: number): Promise<void> {
    this.logger.log(`[STUB] Legacy deadline reminder → ${supplier.nama_koperasi}, sisa: ${sisaHari} hari`);
  }

  async sendLegacyDeadlineEnforced(supplier: SupplierProfile): Promise<void> {
    this.logger.log(`[STUB] Legacy deadline enforced → ${supplier.nama_koperasi}`);
  }

  async sendCoaExpiryReminder(supplier: SupplierProfile, sisaHari: number): Promise<void> {
    this.logger.log(`[STUB] COA expiry reminder → ${supplier.nama_koperasi}, expires in ${sisaHari} days`);
  }

  /**
   * Notify VALAM admin when a new Global RFQ is submitted by a buyer.
   * TODO: Replace with email/WhatsApp/push integration.
   */
  async sendNewGlobalRfqToAdmin(rfqData: {
    rfq_number: string;
    buyer_email: string;
    summary: {
      company: string;
      destination: string;
      volume_kg: number;
      pa_minimum: number;
      documents: string[];
      referenced_batch: string | null;
    };
  }): Promise<void> {
    this.logger.log(
      `[STUB] New Global RFQ notification to admin → ${rfqData.rfq_number} from ${rfqData.buyer_email}, ` +
      `company: ${rfqData.summary.company}, volume: ${rfqData.summary.volume_kg}kg, ` +
      `PA min: ${rfqData.summary.pa_minimum}%, docs: ${rfqData.summary.documents.join(', ')}` +
      (rfqData.summary.referenced_batch ? `, ref batch: ${rfqData.summary.referenced_batch}` : '')
    );
  }
}
