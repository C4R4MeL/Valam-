import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupplierStorageService } from './supplier-storage.service';
import { NotificationService } from './notification.service';
import { RegisterSupplierDto } from './dto/register-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { ReviewAction } from './dto/review-document.dto';
import {
  SupplierStatus,
  TipeDocument,
  StatusDokumen,
  AksiVerifikasi,
} from '@prisma/client';

@Injectable()
export class SupplierService {
  private readonly logger = new Logger(SupplierService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: SupplierStorageService,
    private readonly notificationService: NotificationService,
  ) {}

  // ── Supplier Endpoints ──────────────────────────────────────────

  /**
   * Register a new supplier profile (Poin 1 data).
   * Status = TERDAFTAR.
   */
  async register(userId: string, dto: RegisterSupplierDto) {
    // Check if supplier profile already exists
    const existing = await this.prisma.supplierProfile.findUnique({
      where: { user_id: userId },
    });
    if (existing) {
      throw new ConflictException('Profil supplier sudah terdaftar untuk akun ini.');
    }

    const supplier = await this.prisma.supplierProfile.create({
      data: {
        user_id: userId,
        nama_koperasi: dto.namaKoperasi,
        nib: dto.nib,
        npwp: dto.npwp,
        nama_pic: dto.namaPic,
        ktp_pic: dto.ktpPic,
        whatsapp: dto.whatsapp,
        alamat_lengkap: dto.alamatLengkap,
        kabupaten: dto.kabupaten,
        kecamatan: dto.kecamatan,
        desa: dto.desa,
        kapasitas_produksi: dto.kapasitasProduksi,
        grade_nilam: dto.gradeNilam,
        nomor_rekening: dto.nomorRekening,
        nama_bank: dto.namaBank,
        nama_rekening: dto.namaRekening,
        tahun_berdiri: dto.tahunBerdiri || '2020',
        jumlah_anggota: dto.jumlahAnggota !== undefined ? dto.jumlahAnggota : 15,
        minimum_order: dto.minimumOrder !== undefined ? dto.minimumOrder : 10,
        durasi_produksi: dto.durasiProduksi || '7-14 Hari',
        metode_distilasi: dto.metodeDistilasi || 'Uap (Steam Distillation)',
        bahan_baku: dto.bahanBaku || '100% Daun Nilam Segar',
        website: dto.website || '',
        status: SupplierStatus.TERDAFTAR,
      },
    });

    await this.notificationService.sendRegistrationConfirmation(supplier);

    return {
      message: 'Registrasi supplier berhasil. Silakan upload dokumen verifikasi.',
      data: supplier,
    };
  }

  /**
   * Get current supplier profile with documents and legacy info.
   */
  async getMyProfile(userId: string) {
    const supplier = await this.prisma.supplierProfile.findUnique({
      where: { user_id: userId },
      include: {
        documents: { orderBy: { uploaded_at: 'desc' } },
      },
    });

    if (!supplier) {
      throw new NotFoundException('Profil supplier belum terdaftar.');
    }

    // Map documents with signed/local preview URLs
    const documentsWithUrls = await Promise.all(
      supplier.documents.map(async (doc) => ({
        ...doc,
        preview_url: await this.storageService.getSignedUrl(doc.file_url),
      })),
    );
    (supplier as any).documents = documentsWithUrls;

    // Compute legacy info
    let legacyInfo = null;
    if (supplier.is_legacy && supplier.legacy_deadline) {
      const now = new Date();
      const diffMs = supplier.legacy_deadline.getTime() - now.getTime();
      const sisaHari = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      legacyInfo = {
        isLegacy: true,
        deadline: supplier.legacy_deadline,
        sisaHari,
        sudahLewat: sisaHari <= 0,
      };
    }

    // Compute document completeness
    const docStatus = this.getDocumentCompleteness(supplier.documents);

    return {
      data: supplier,
      legacyInfo,
      documentCompleteness: docStatus,
    };
  }

  /**
   * Update supplier profile data (Poin 1 fields + bank account).
   */
  async updateProfile(userId: string, dto: UpdateSupplierDto) {
    const supplier = await this.findSupplierByUserId(userId);

    const updateData: any = {};
    if (dto.namaKoperasi !== undefined) updateData.nama_koperasi = dto.namaKoperasi;
    if (dto.nib !== undefined) updateData.nib = dto.nib;
    if (dto.npwp !== undefined) updateData.npwp = dto.npwp;
    if (dto.namaPic !== undefined) updateData.nama_pic = dto.namaPic;
    if (dto.ktpPic !== undefined) updateData.ktp_pic = dto.ktpPic;
    if (dto.whatsapp !== undefined) updateData.whatsapp = dto.whatsapp;
    if (dto.alamatLengkap !== undefined) updateData.alamat_lengkap = dto.alamatLengkap;
    if (dto.kabupaten !== undefined) updateData.kabupaten = dto.kabupaten;
    if (dto.kecamatan !== undefined) updateData.kecamatan = dto.kecamatan;
    if (dto.desa !== undefined) updateData.desa = dto.desa;
    if (dto.kapasitasProduksi !== undefined) updateData.kapasitas_produksi = dto.kapasitasProduksi;
    if (dto.gradeNilam !== undefined) updateData.grade_nilam = dto.gradeNilam;
    if (dto.nomorRekening !== undefined) updateData.nomor_rekening = dto.nomorRekening;
    if (dto.namaBank !== undefined) updateData.nama_bank = dto.namaBank;
    if (dto.namaRekening !== undefined) updateData.nama_rekening = dto.namaRekening;
    if (dto.tahunBerdiri !== undefined) updateData.tahun_berdiri = dto.tahunBerdiri;
    if (dto.jumlahAnggota !== undefined) updateData.jumlah_anggota = dto.jumlahAnggota;
    if (dto.minimumOrder !== undefined) updateData.minimum_order = dto.minimumOrder;
    if (dto.durasiProduksi !== undefined) updateData.durasi_produksi = dto.durasiProduksi;
    if (dto.metodeDistilasi !== undefined) updateData.metode_distilasi = dto.metodeDistilasi;
    if (dto.bahanBaku !== undefined) updateData.bahan_baku = dto.bahanBaku;
    if (dto.website !== undefined) updateData.website = dto.website;

    const updated = await this.prisma.supplierProfile.update({
      where: { id: supplier.id },
      data: updateData,
    });

    return { message: 'Profil berhasil diperbarui.', data: updated };
  }

  /**
   * Upload a document for verification.
   */
  async uploadDocument(
    userId: string,
    tipeDocument: TipeDocument,
    tanggalCoa: string | undefined,
    file: Express.Multer.File,
  ) {
    const supplier = await this.findSupplierByUserId(userId);

    // Validate COA date is required for COA type
    if (tipeDocument === TipeDocument.COA && !tanggalCoa) {
      throw new BadRequestException('Tanggal COA wajib diisi saat mengupload dokumen COA.');
    }

    // Validate COA not expired
    if (tipeDocument === TipeDocument.COA && tanggalCoa) {
      this.validateCoaDate(tanggalCoa);
    }

    // Auto-replace single-type documents (not FOTO_FASILITAS)
    if (tipeDocument !== TipeDocument.FOTO_FASILITAS) {
      const existingDoc = await this.prisma.supplierDocument.findFirst({
        where: { supplier_id: supplier.id, tipe_document: tipeDocument },
      });

      if (existingDoc) {
        if (existingDoc.status_dokumen === StatusDokumen.APPROVED) {
          throw new BadRequestException(
            `Dokumen ${tipeDocument} Anda sudah disetujui oleh admin dan tidak dapat diubah.`,
          );
        }
        
        // Delete old file from storage and database
        await this.storageService.deleteFile(existingDoc.file_url);
        await this.prisma.supplierDocument.delete({ where: { id: existingDoc.id } });
      }
    }

    // Upload to storage
    const uploaded = await this.storageService.uploadDocument(
      supplier.id,
      tipeDocument,
      file,
    );

    // Save document record
    const document = await this.prisma.supplierDocument.create({
      data: {
        supplier_id: supplier.id,
        tipe_document: tipeDocument,
        file_url: uploaded.path,
        file_name: uploaded.fileName,
        file_size: uploaded.fileSize,
        tanggal_coa: tanggalCoa ? new Date(tanggalCoa) : null,
        status_dokumen: StatusDokumen.PENDING,
      },
    });

    return { message: 'Dokumen berhasil diupload.', data: document };
  }

  /**
   * Delete a document (only PENDING or REVISION_REQUESTED).
   */
  async deleteDocument(userId: string, documentId: string) {
    const supplier = await this.findSupplierByUserId(userId);

    const document = await this.prisma.supplierDocument.findFirst({
      where: { id: documentId, supplier_id: supplier.id },
    });

    if (!document) {
      throw new NotFoundException('Dokumen tidak ditemukan.');
    }

    if (
      document.status_dokumen !== StatusDokumen.PENDING &&
      document.status_dokumen !== StatusDokumen.REVISION_REQUESTED
    ) {
      throw new ForbiddenException('Dokumen yang sudah di-review tidak bisa dihapus.');
    }

    // Delete from storage
    await this.storageService.deleteFile(document.file_url);

    // Delete record
    await this.prisma.supplierDocument.delete({ where: { id: documentId } });

    return { message: 'Dokumen berhasil dihapus.' };
  }

  /**
   * Submit all documents for verification.
   * Validates completeness → status changes to DALAM_VERIFIKASI.
   */
  async submitVerification(userId: string) {
    const supplier = await this.findSupplierByUserId(userId);

    if (supplier.status === SupplierStatus.TERVERIFIKASI) {
      throw new BadRequestException('Supplier sudah terverifikasi.');
    }
    if (supplier.status === SupplierStatus.DALAM_VERIFIKASI) {
      throw new BadRequestException('Dokumen sudah dalam proses review. Harap tunggu konfirmasi.');
    }

    // Get all documents
    const documents = await this.prisma.supplierDocument.findMany({
      where: { supplier_id: supplier.id },
    });

    // Validate completeness
    const errors: string[] = [];

    // Check each required document type
    const requiredTypes: TipeDocument[] = [
      TipeDocument.AKTA_KOPERASI,
      TipeDocument.COA,
      TipeDocument.FOTO_FASILITAS,
      TipeDocument.SURAT_PERNYATAAN,
    ];

    for (const tipe of requiredTypes) {
      const docs = documents.filter((d) => d.tipe_document === tipe);
      if (docs.length === 0) {
        const namaDoc = this.getDocumentTypeName(tipe);
        errors.push(`${namaDoc} belum diupload.`);
      }
    }

    // Check FOTO_FASILITAS minimum 3
    const fotoCount = documents.filter((d) => d.tipe_document === TipeDocument.FOTO_FASILITAS).length;
    if (fotoCount > 0 && fotoCount < 3) {
      errors.push(`Foto fasilitas penyulingan minimal 3 foto. Saat ini baru ada ${fotoCount} foto.`);
    }

    // Check COA not expired
    const coaDocs = documents.filter((d) => d.tipe_document === TipeDocument.COA);
    for (const coa of coaDocs) {
      if (coa.tanggal_coa) {
        const diffDays = this.daysDiff(coa.tanggal_coa, new Date());
        if (diffDays > 180) {
          errors.push('COA sudah kadaluarsa. Harap upload COA terbaru dari laboratorium terakreditasi (maksimal 6 bulan terakhir).');
        }
      }
    }

    // Check no REJECTED documents
    const rejectedDocs = documents.filter((d) => d.status_dokumen === StatusDokumen.REJECTED);
    if (rejectedDocs.length > 0) {
      errors.push(`Ada ${rejectedDocs.length} dokumen yang ditolak. Harap upload ulang sebelum submit.`);
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Dokumen belum lengkap atau ada yang perlu diperbaiki.',
        errors,
      });
    }

    // All validations passed — update status
    const updated = await this.prisma.supplierProfile.update({
      where: { id: supplier.id },
      data: { status: SupplierStatus.DALAM_VERIFIKASI },
    });

    await this.notificationService.sendDocumentSubmittedToAdmin(updated);

    return {
      message: 'Dokumen berhasil disubmit untuk verifikasi. Tim Valam akan segera meninjau.',
      data: updated,
    };
  }

  // ── Admin Endpoints ─────────────────────────────────────────────

  /**
   * List suppliers with filtering and pagination.
   */
  async listSuppliers(query: {
    status?: SupplierStatus;
    isLegacy?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.isLegacy === 'true') where.is_legacy = true;
    if (query.isLegacy === 'false') where.is_legacy = false;
    if (query.search) {
      where.nama_koperasi = { contains: query.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.supplierProfile.findMany({
        where,
        include: {
          documents: true,
          user: { select: { email: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.supplierProfile.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get supplier detail with documents and verification logs.
   */
  async getSupplierDetail(supplierId: string) {
    const supplier = await this.prisma.supplierProfile.findUnique({
      where: { id: supplierId },
      include: {
        documents: { orderBy: { uploaded_at: 'desc' } },
        verification_logs: { orderBy: { created_at: 'desc' }, take: 50 },
        user: { select: { email: true } },
      },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier tidak ditemukan.');
    }

    // Map documents with signed/local preview URLs
    const documentsWithUrls = await Promise.all(
      supplier.documents.map(async (doc) => ({
        ...doc,
        preview_url: await this.storageService.getSignedUrl(doc.file_url),
      })),
    );
    (supplier as any).documents = documentsWithUrls;

    return { data: supplier };
  }

  /**
   * Admin reviews a specific document.
   */
  async reviewDocument(
    supplierId: string,
    documentId: string,
    adminId: string,
    aksi: ReviewAction,
    catatan?: string,
  ) {
    const document = await this.prisma.supplierDocument.findFirst({
      where: { id: documentId, supplier_id: supplierId },
    });

    if (!document) {
      throw new NotFoundException('Dokumen tidak ditemukan.');
    }

    const supplier = await this.prisma.supplierProfile.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier tidak ditemukan.');
    }

    let newDocStatus: StatusDokumen;
    let aksiLog: AksiVerifikasi;
    let newSupplierStatus: SupplierStatus | undefined;

    switch (aksi) {
      case ReviewAction.APPROVE:
        newDocStatus = StatusDokumen.APPROVED;
        aksiLog = AksiVerifikasi.APPROVE_DOCUMENT;
        break;
      case ReviewAction.REJECT:
        newDocStatus = StatusDokumen.REJECTED;
        aksiLog = AksiVerifikasi.REJECT_DOCUMENT;
        // Reject → supplier status back to TERDAFTAR
        newSupplierStatus = SupplierStatus.TERDAFTAR;
        break;
      case ReviewAction.REQUEST_REVISION:
        newDocStatus = StatusDokumen.REVISION_REQUESTED;
        aksiLog = AksiVerifikasi.REQUEST_REVISION;
        break;
      default:
        throw new BadRequestException('Aksi tidak valid.');
    }

    // Transaction: update document + optional supplier status + log
    await this.prisma.$transaction(async (tx) => {
      await tx.supplierDocument.update({
        where: { id: documentId },
        data: {
          status_dokumen: newDocStatus,
          catatan_reviewer: catatan || null,
          reviewed_at: new Date(),
          reviewed_by: adminId,
        },
      });

      if (newSupplierStatus) {
        await tx.supplierProfile.update({
          where: { id: supplierId },
          data: { status: newSupplierStatus },
        });

        // Also create RESET log
        await tx.verificationLog.create({
          data: {
            supplier_id: supplierId,
            admin_id: adminId,
            aksi: AksiVerifikasi.RESET_TO_TERDAFTAR,
            document_id: documentId,
            catatan: `Dokumen ${document.tipe_document} ditolak: ${catatan || '-'}`,
          },
        });
      }

      await tx.verificationLog.create({
        data: {
          supplier_id: supplierId,
          admin_id: adminId,
          aksi: aksiLog,
          document_id: documentId,
          catatan: catatan || null,
        },
      });
    });

    // Send notifications
    if (aksi === ReviewAction.REJECT) {
      await this.notificationService.sendDocumentRejected(supplier, document, catatan || '');
    } else if (aksi === ReviewAction.REQUEST_REVISION) {
      await this.notificationService.sendRevisionRequested(supplier, document, catatan || '');
    }

    // Return updated state
    const updatedSupplier = await this.getSupplierDetail(supplierId);
    return {
      message: `Dokumen berhasil di-${aksi.toLowerCase()}.`,
      data: updatedSupplier.data,
    };
  }

  /**
   * Admin finalizes verification — all documents must be APPROVED.
   */
  async finalizeVerification(supplierId: string, adminId: string) {
    const supplier = await this.prisma.supplierProfile.findUnique({
      where: { id: supplierId },
      include: { documents: true },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier tidak ditemukan.');
    }

    if (supplier.status === SupplierStatus.TERVERIFIKASI) {
      throw new BadRequestException('Supplier sudah terverifikasi.');
    }

    // Check all documents are approved
    const requiredTypes: TipeDocument[] = [
      TipeDocument.AKTA_KOPERASI,
      TipeDocument.COA,
      TipeDocument.FOTO_FASILITAS,
      TipeDocument.SURAT_PERNYATAAN,
    ];

    const unapproved: string[] = [];
    for (const tipe of requiredTypes) {
      const docs = supplier.documents.filter(
        (d) => d.tipe_document === tipe && d.status_dokumen === StatusDokumen.APPROVED,
      );
      if (docs.length === 0) {
        unapproved.push(this.getDocumentTypeName(tipe));
      }
    }

    if (unapproved.length > 0) {
      throw new BadRequestException({
        message: 'Tidak semua dokumen telah diapprove.',
        unapprovedDocuments: unapproved,
      });
    }

    // Finalize
    const updated = await this.prisma.supplierProfile.update({
      where: { id: supplierId },
      data: {
        status: SupplierStatus.TERVERIFIKASI,
        verified_at: new Date(),
        is_legacy: false,
        legacy_deadline: null,
      },
    });

    await this.prisma.verificationLog.create({
      data: {
        supplier_id: supplierId,
        admin_id: adminId,
        aksi: AksiVerifikasi.FINALIZE_VERIFIED,
        catatan: 'Semua dokumen diverifikasi. Status: TERVERIFIKASI.',
      },
    });

    await this.notificationService.sendVerificationApproved(updated);

    return {
      message: `Supplier ${updated.nama_koperasi} berhasil diverifikasi!`,
      data: updated,
    };
  }

  /**
   * Admin runs legacy supplier migration.
   */
  async legacyMigration(adminId: string, supplierIds: string[], deadlineDays: number = 30) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + deadlineDays);

    let migrated = 0;
    let skipped = 0;
    const results: { id: string; name: string; status: string }[] = [];

    for (const id of supplierIds) {
      const supplier = await this.prisma.supplierProfile.findUnique({
        where: { id },
      });

      if (!supplier) {
        results.push({ id, name: '-', status: 'NOT_FOUND' });
        skipped++;
        continue;
      }

      if (supplier.is_legacy) {
        results.push({ id, name: supplier.nama_koperasi, status: 'ALREADY_MIGRATED' });
        skipped++;
        continue;
      }

      await this.prisma.supplierProfile.update({
        where: { id },
        data: {
          status: SupplierStatus.LEGACY_VERIFIED,
          is_legacy: true,
          legacy_deadline: deadline,
        },
      });

      await this.prisma.verificationLog.create({
        data: {
          supplier_id: id,
          admin_id: adminId,
          aksi: AksiVerifikasi.LEGACY_REMINDER_SENT,
          catatan: `Supplier lama dimigrasikan ke sistem verifikasi baru. Batas waktu melengkapi dokumen: ${deadline.toISOString().split('T')[0]}`,
        },
      });

      await this.notificationService.sendLegacyMigrationNotice(supplier, deadline);

      results.push({ id, name: supplier.nama_koperasi, status: 'MIGRATED' });
      migrated++;
    }

    this.logger.log(`[Legacy Migration] Migrated: ${migrated}, Skipped: ${skipped}`);

    return {
      message: `Migrasi selesai. ${migrated} supplier dimigrasikan, ${skipped} dilewati.`,
      migrated,
      skipped,
      deadline: deadline.toISOString().split('T')[0],
      details: results,
    };
  }

  /**
   * Get legacy suppliers status for admin monitoring.
   */
  async getLegacyStatus() {
    const suppliers = await this.prisma.supplierProfile.findMany({
      where: { status: SupplierStatus.LEGACY_VERIFIED },
      include: {
        documents: true,
        user: { select: { email: true } },
      },
      orderBy: { legacy_deadline: 'asc' },
    });

    return {
      data: suppliers.map((s) => {
        const now = new Date();
        const sisaHari = s.legacy_deadline
          ? Math.max(0, Math.ceil((s.legacy_deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
          : null;

        return {
          ...s,
          sisaHari,
          documentCompleteness: this.getDocumentCompleteness(s.documents),
        };
      }),
      total: suppliers.length,
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────

  async findSupplierByUserId(userId: string) {
    const supplier = await this.prisma.supplierProfile.findUnique({
      where: { user_id: userId },
    });
    if (!supplier) {
      throw new NotFoundException('Profil supplier belum terdaftar. Silakan registrasi terlebih dahulu.');
    }
    return supplier;
  }

  private validateCoaDate(tanggalCoa: string) {
    const coaDate = new Date(tanggalCoa);
    const diffDays = this.daysDiff(coaDate, new Date());
    if (diffDays > 180) {
      throw new BadRequestException(
        'COA sudah kadaluarsa. Harap upload COA terbaru dari laboratorium terakreditasi (maksimal 6 bulan terakhir).',
      );
    }
  }

  private daysDiff(dateA: Date, dateB: Date): number {
    return Math.floor(Math.abs(dateB.getTime() - dateA.getTime()) / (1000 * 60 * 60 * 24));
  }

  private getDocumentCompleteness(documents: any[]) {
    const types: TipeDocument[] = [
      TipeDocument.AKTA_KOPERASI,
      TipeDocument.COA,
      TipeDocument.FOTO_FASILITAS,
      TipeDocument.SURAT_PERNYATAAN,
    ];

    return types.map((tipe) => {
      const docs = documents.filter((d: any) => d.tipe_document === tipe);
      const minRequired = tipe === TipeDocument.FOTO_FASILITAS ? 3 : 1;
      return {
        tipe,
        uploaded: docs.length,
        required: minRequired,
        complete: docs.length >= minRequired,
        statuses: docs.map((d: any) => d.status_dokumen),
      };
    });
  }

  private getDocumentTypeName(tipe: TipeDocument): string {
    const names: Record<TipeDocument, string> = {
      AKTA_KOPERASI: 'Akta Pendirian Koperasi + SK Kemenkop',
      COA: 'Certificate of Analysis (COA)',
      FOTO_FASILITAS: 'Foto Fasilitas Penyulingan',
      SURAT_PERNYATAAN: 'Surat Pernyataan Kesanggupan',
    };
    return names[tipe];
  }

  async getPublicSuppliers(status?: string, limit = 4) {
    const where: any = {};
    if (status) {
      where.status = status as SupplierStatus;
    } else {
      where.status = { in: [SupplierStatus.TERVERIFIKASI, SupplierStatus.LEGACY_VERIFIED] };
    }

    return this.prisma.supplierProfile.findMany({
      where,
      include: {
        user: {
          select: {
            profile: {
              select: {
                avatar_url: true,
              },
            },
          },
        },
      },
      orderBy: { verified_at: 'desc' },
      take: limit,
    });
  }
}

