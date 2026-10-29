import { reviewedReportSelection, publicQuality } from '../quality/quality.public';
import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PUBLIC_SUPPLIER_PROFILE_SELECT, PUBLIC_USER_SELECT } from '../users/public-user.select';
import { randomUUID } from 'crypto';
import { CreateBatchDto } from './create-batch.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: any, ownerId?: string, includeUnpublished = false) {
    const where: any = {};
    
    if (query.status) {
      where.status = query.status;
    }
    
    // Support filtering by supplier_id or supplierId
    const supplierId = query.supplier_id || query.supplierId;
    if (supplierId) {
      where.supplier_id = supplierId;
    }
    if (ownerId) where.supplier_id = ownerId;
    else if (!includeUnpublished) where.status = 'VERIFIED';

    const products = await this.prisma.product.findMany({
      where,
      include: {
        qc_result: true,
        lab_reports: reviewedReportSelection,
        supplier: {
          include: {
            profile: true,
            supplier_profile: true,
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Map database records to dashboard/marketplace readable structure
    const data = products.map(p => {
      // Get company name from profile or supplier_profile
      const companyName = p.supplier?.supplier_profile?.nama_koperasi || 
                          p.supplier?.profile?.company_name || 
                          'Koperasi Atsiri';

      return {
        id: p.id,
        batch_code: p.batch_code,
        created_at: p.created_at,
        supplier_name: companyName,
        supplier_contact: p.supplier.supplier_profile?.whatsapp || p.supplier.profile?.phone || null,
        status: p.status,
        is_demo: p.is_demo, price_type: p.price_type,
        moq_kg: p.moq_kg,
        lab_verified: false, quality_status: 'UNEVALUATED',
        supplier_identity_verified: p.supplier.supplier_profile?.status === 'TERVERIFIKASI',
        origin_village: p.origin_village || '',
        origin_district: p.origin_district || '',
        pa_percentage: p.qc_result?.pa_percentage ?? null,
        moisture: p.qc_result?.moisture ?? null,
        specific_gravity: p.qc_result?.specific_gravity ?? null,
        refractive_index: p.qc_result?.refractive_index ?? null,
        optical_rotation: p.qc_result?.optical_rotation ?? null,
        available_volume_kg: p.available_volume_kg,
        price_per_kg: p.price_per_kg,
        images: p.images && p.images.length > 0 ? p.images : ["/images/premium_oil_dark.png"],
        tested_at: p.qc_result?.tested_at || null,
        qc_result: p.qc_result,
        supplier_id: p.supplier_id,
        is_featured: p.is_featured,
        ...(!ownerId && !includeUnpublished ? publicQuality(p) : {}),
      };
    });

    return {
      data,
      total: data.length,
    };
  }

  async findOne(id: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const product = await this.prisma.product.findFirst({
      where: isUuid
        ? {
            OR: [
              { id, status: 'VERIFIED' },
              { batch_code: id, status: 'VERIFIED' }
            ]
          }
        : {
            batch_code: id, status: 'VERIFIED'
          },
      include: {
        qc_result: true,
        lab_reports: reviewedReportSelection,
        supplier: {
          include: {
            profile: true,
            supplier_profile: true,
          }
        }
      }
    });

    if (!product) {
      throw new NotFoundException(`Product with ID or batch code ${id} not found`);
    }

    const companyName = product.supplier?.supplier_profile?.nama_koperasi || 
                        product.supplier?.profile?.company_name || 
                        'Koperasi Atsiri';

    return {
      id: product.id,
      batch_code: product.batch_code,
      supplier_name: companyName,
      supplier_contact: product.supplier.supplier_profile?.whatsapp || product.supplier.profile?.phone || null,
      status: product.status,
      is_demo: product.is_demo, price_type: product.price_type,
      moq_kg: product.moq_kg,
      supplier_identity_verified: product.supplier.supplier_profile?.status === 'TERVERIFIKASI',
      origin_village: product.origin_village || '',
      origin_district: product.origin_district || '',
      available_volume_kg: product.available_volume_kg,
      price_per_kg: product.price_per_kg,
      images: product.images && product.images.length > 0 ? product.images : ["/images/premium_oil_dark.png"],
      supplier_id: product.supplier_id,
      is_featured: product.is_featured,
      ...publicQuality(product),
    };
  }

  async createBatch(supplierId: string, createBatchDto: CreateBatchDto) {
    // Generate a clean batch code if none is provided
    const randomSuffix = randomUUID();
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const batchCode = createBatchDto.batch_code || `VLM-${dateStr}-${randomSuffix}`;

    const product = await this.prisma.product.create({
      data: {
        supplier_id: supplierId,
        batch_code: batchCode,
        status: "DRAFT",
        origin_village: createBatchDto.origin_village || "",
        origin_district: createBatchDto.origin_district || "",
        origin_province: createBatchDto.origin_province || null,
        production_date: createBatchDto.production_date ? new Date(createBatchDto.production_date) : null,
        total_volume_kg: createBatchDto.total_volume_kg,
        available_volume_kg: createBatchDto.total_volume_kg,
        price_per_kg: createBatchDto.price_per_kg ?? 0,
        images: createBatchDto.images || ["/images/premium_oil_dark.png"],
      }
    });

    return product;
  }

  async setPrice(id: string, supplierId: string, price: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Batch tidak ditemukan.`);
    }

    if (!Number.isFinite(price) || price <= 0) throw new BadRequestException('Harga penawaran harus positif');
    if (!['AWAITING_PRICE', 'VERIFIED'].includes(product.status)) {
      throw new BadRequestException('Catat informasi QC terlebih dahulu; pencatatan bukan bukti kelulusan mutu');
    }

    // Match supplier profile to get supplierId
    const supplier = await this.prisma.supplierProfile.findUnique({
      where: { user_id: supplierId },
    });

    if (!supplier || product.supplier_id !== supplier.user_id) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk memperbarui batch ini.');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        price_per_kg: price,
        status: 'VERIFIED', // Make it active in marketplace
      },
    });

    return updated;
  }

  async updateProduct(id: string, supplierId: string, updateDto: any) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Batch tidak ditemukan.`);
    }

    if (product.supplier_id !== supplierId) {
      throw new ForbiddenException(`Anda tidak memiliki akses untuk mengubah batch ini.`);
    }

    const volume = updateDto.total_volume_kg === undefined ? product.total_volume_kg : Number(updateDto.total_volume_kg);
    if (!Number.isFinite(volume) || volume < 0) throw new BadRequestException('Volume tidak valid');
    const changed = await this.prisma.product.updateMany({ where: { id, supplier_id: supplierId, status: 'DRAFT', order_items: { none: {} }, testing_requests: { none: {} }, lab_reports: { none: {} } }, data: {
      origin_village: updateDto.origin_village ?? product.origin_village,
      origin_district: updateDto.origin_district ?? product.origin_district,
      total_volume_kg: volume, available_volume_kg: volume,
      images: updateDto.images ?? product.images,
    } });
    if (changed.count !== 1) throw new ConflictException('Batch yang diproses atau memiliki pesanan tidak dapat diubah; buat batch baru');
    return this.prisma.product.findUnique({ where: { id } });
  }

  async deleteProduct(id: string, supplierId: string) {
    return this.prisma.$transaction(async tx => {
      const product = await tx.product.findUnique({ where: { id }, include: { _count: { select: { testing_requests: true, lab_reports: true, quality_files: true } } } });
      if (!product) throw new NotFoundException('Batch tidak ditemukan');
      if (product.supplier_id !== supplierId) throw new ForbiddenException('Not your batch');
      if (product._count.testing_requests || product._count.lab_reports || product._count.quality_files) throw new ConflictException('Batch memiliki riwayat pengujian atau dokumen; riwayat tidak dapat dihapus');
      if (await tx.orderItem.count({ where: { product_id: id } })) throw new ConflictException('Batch memiliki catatan pesanan dan tidak dapat dihapus');
      await tx.product.delete({ where: { id } });
      return { success: true };
    });
  }

  async getPublicSupplierProfile(id: string) {
    const decodedName = decodeURIComponent(id);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const whereClause: any = {};
    if (isUuid) {
      whereClause.OR = [
        { id: id },
        { user_id: id }
      ];
    } else {
      whereClause.nama_koperasi = decodedName;
    }

    const supplierProfile = await this.prisma.supplierProfile.findFirst({
      where: whereClause,
      orderBy: {
        updated_at: 'desc'
      },
      select: {
        ...PUBLIC_SUPPLIER_PROFILE_SELECT,
        user: {
          select: {
            ...PUBLIC_USER_SELECT,
            products: {
              where: { status: 'VERIFIED' },
              include: { qc_result: true, lab_reports: reviewedReportSelection }
            },
            circular_products: {
              where: { status: 'APPROVED' }
            }
          }
        }
      }
    });

    if (!supplierProfile || !supplierProfile.user) {
      throw new NotFoundException('Profil supplier tidak ditemukan.');
    }

    const { user, ...publicProfile } = supplierProfile;
    return { data: { ...user, products: user.products.map(({ lab_reports, ...p }) => ({ ...p, ...publicQuality({ ...p, lab_reports }) })), supplier_profile: publicProfile } };
  }
}
