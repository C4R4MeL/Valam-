import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from './notification.service';
import { SupplierStatus, AksiVerifikasi, TipeDocument } from '@prisma/client';

@Injectable()
export class SupplierCronService {
  private readonly logger = new Logger(SupplierCronService.name);

  // System admin ID for automated actions
  private readonly SYSTEM_ADMIN_ID = '00000000-0000-0000-0000-000000000000';

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Every day at 00:00 WIB (17:00 UTC):
   * Enforce deadline for LEGACY_VERIFIED suppliers.
   * Changes status to DALAM_VERIFIKASI if deadline has passed.
   */
  @Cron('0 17 * * *')
  async enforceLegacyDeadline() {
    this.logger.log('[Cron] Checking legacy supplier deadlines...');

    const now = new Date();
    const expiredSuppliers = await this.prisma.supplierProfile.findMany({
      where: {
        status: SupplierStatus.LEGACY_VERIFIED,
        is_legacy: true,
        legacy_deadline: { lt: now },
      },
    });

    for (const supplier of expiredSuppliers) {
      await this.prisma.supplierProfile.update({
        where: { id: supplier.id },
        data: { status: SupplierStatus.DALAM_VERIFIKASI },
      });

      await this.prisma.verificationLog.create({
        data: {
          supplier_id: supplier.id,
          admin_id: this.SYSTEM_ADMIN_ID,
          aksi: AksiVerifikasi.LEGACY_DEADLINE_ENFORCED,
          catatan: `Batas waktu pelengkapan dokumen telah lewat. Status berubah dari LEGACY_VERIFIED ke DALAM_VERIFIKASI. Akses listing produk dinonaktifkan.`,
        },
      });

      await this.notificationService.sendLegacyDeadlineEnforced(supplier);
    }

    if (expiredSuppliers.length > 0) {
      this.logger.log(`[Cron] Enforced deadline for ${expiredSuppliers.length} legacy suppliers.`);
    }
  }

  /**
   * Every day at 08:00 WIB (01:00 UTC):
   * Send final reminder to LEGACY_VERIFIED suppliers with 7 days left.
   */
  @Cron('0 1 * * *')
  async sendLegacyDeadlineReminder() {
    this.logger.log('[Cron] Checking legacy suppliers approaching deadline...');

    const now = new Date();
    const reminderThreshold = new Date(now);
    reminderThreshold.setDate(reminderThreshold.getDate() + 7);

    const suppliers = await this.prisma.supplierProfile.findMany({
      where: {
        status: SupplierStatus.LEGACY_VERIFIED,
        is_legacy: true,
        legacy_deadline: {
          gt: now,
          lte: reminderThreshold,
        },
      },
    });

    for (const supplier of suppliers) {
      const sisaHari = Math.ceil(
        (supplier.legacy_deadline!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      await this.notificationService.sendLegacyDeadlineReminder(supplier, sisaHari);
    }

    if (suppliers.length > 0) {
      this.logger.log(`[Cron] Sent deadline reminders to ${suppliers.length} legacy suppliers.`);
    }
  }

  /**
   * 1st of every month at 00:00 UTC:
   * Remind verified suppliers whose COA expires within 30 days.
   */
  @Cron('0 0 1 * *')
  async sendCoaExpiryReminder() {
    this.logger.log('[Cron] Checking COA expiry for verified suppliers...');

    const now = new Date();
    const expiryThreshold = new Date(now);
    expiryThreshold.setDate(expiryThreshold.getDate() - 150); // 180 - 30 = 150 days ago

    // Find verified suppliers with COA older than 150 days (expires in <30 days)
    const expiringCoas = await this.prisma.supplierDocument.findMany({
      where: {
        tipe_document: TipeDocument.COA,
        status_dokumen: 'APPROVED',
        tanggal_coa: { lte: expiryThreshold },
        supplier: { status: SupplierStatus.TERVERIFIKASI },
      },
      include: { supplier: true },
    });

    const uniqueSuppliers = new Map();
    for (const doc of expiringCoas) {
      if (!uniqueSuppliers.has(doc.supplier_id)) {
        const sisaHari = 180 - Math.floor(
          (now.getTime() - doc.tanggal_coa!.getTime()) / (1000 * 60 * 60 * 24),
        );
        uniqueSuppliers.set(doc.supplier_id, { supplier: doc.supplier, sisaHari });
      }
    }

    for (const { supplier, sisaHari } of uniqueSuppliers.values()) {
      await this.notificationService.sendCoaExpiryReminder(supplier, Math.max(0, sisaHari));
    }

    if (uniqueSuppliers.size > 0) {
      this.logger.log(`[Cron] Sent COA expiry reminders to ${uniqueSuppliers.size} suppliers.`);
    }
  }
}
