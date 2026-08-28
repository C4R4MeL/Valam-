import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: any) {
    const where: any = {};
    
    if (query.status) {
      where.status = query.status;
    }
    
    // Support filtering by supplier_id or supplierId
    const supplierId = query.supplier_id || query.supplierId;
    if (supplierId) {
      where.supplier_id = supplierId;
    }

    const products = await this.prisma.product.findMany({
      where,
      include: {
        qc_result: true,
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
        supplier_name: companyName,
        status: p.status,
        origin_village: p.origin_village || '',
        origin_district: p.origin_district || '',
        pa_percentage: p.qc_result?.pa_percentage || 0,
        moisture: p.qc_result?.moisture || 0,
        specific_gravity: p.qc_result?.specific_gravity || null,
        refractive_index: p.qc_result?.refractive_index || null,
        optical_rotation: p.qc_result?.optical_rotation || null,
        available_volume_kg: p.available_volume_kg,
        price_per_kg: p.price_per_kg,
        images: p.images && p.images.length > 0 ? p.images : ["/images/premium_oil_dark.png"],
        tested_at: p.qc_result?.tested_at || null,
        qc_result: p.qc_result,
        supplier_id: p.supplier_id,
        is_featured: p.is_featured
      };
    });

    return {
      data,
      total: data.length,
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        qc_result: true,
        supplier: {
          include: {
            profile: true,
            supplier_profile: true,
          }
        }
      }
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const companyName = product.supplier?.supplier_profile?.nama_koperasi || 
                        product.supplier?.profile?.company_name || 
                        'Koperasi Atsiri';

    return {
      id: product.id,
      batch_code: product.batch_code,
      supplier_name: companyName,
      status: product.status,
      origin_village: product.origin_village || '',
      origin_district: product.origin_district || '',
      pa_percentage: product.qc_result?.pa_percentage || 0,
      moisture: product.qc_result?.moisture || 0,
      specific_gravity: product.qc_result?.specific_gravity || null,
      refractive_index: product.qc_result?.refractive_index || null,
      optical_rotation: product.qc_result?.optical_rotation || null,
      available_volume_kg: product.available_volume_kg,
      price_per_kg: product.price_per_kg,
      images: product.images && product.images.length > 0 ? product.images : ["/images/premium_oil_dark.png"],
      tested_at: product.qc_result?.tested_at || null,
      qc_result: product.qc_result,
      supplier_id: product.supplier_id,
      is_featured: product.is_featured
    };
  }

  async createBatch(supplierId: string, createBatchDto: any) {
    // Generate a clean batch code if none is provided
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const batchCode = createBatchDto.batch_code || `VLM-${dateStr}-${randomSuffix}`;

    const product = await this.prisma.product.create({
      data: {
        supplier_id: supplierId,
        batch_code: batchCode,
        status: "DRAFT",
        origin_village: createBatchDto.origin_village || "",
        origin_district: createBatchDto.origin_district || "",
        origin_province: createBatchDto.origin_province || "Aceh",
        total_volume_kg: parseFloat(createBatchDto.total_volume_kg) || 0,
        available_volume_kg: parseFloat(createBatchDto.total_volume_kg) || 0,
        price_per_kg: parseFloat(createBatchDto.price_per_kg) || 0,
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

    // Match supplier profile to get supplierId
    const supplier = await this.prisma.supplierProfile.findUnique({
      where: { user_id: supplierId },
    });

    if (!supplier || product.supplier_id !== supplier.user_id) {
      throw new Error(`Anda tidak memiliki akses untuk memperbarui batch ini.`);
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

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        origin_village: updateDto.origin_village !== undefined ? updateDto.origin_village : product.origin_village,
        origin_district: updateDto.origin_district !== undefined ? updateDto.origin_district : product.origin_district,
        total_volume_kg: updateDto.total_volume_kg !== undefined ? parseFloat(updateDto.total_volume_kg) : product.total_volume_kg,
        available_volume_kg: updateDto.total_volume_kg !== undefined ? parseFloat(updateDto.total_volume_kg) : product.available_volume_kg,
        images: updateDto.images !== undefined ? updateDto.images : product.images,
      }
    });

    return updated;
  }

  async deleteProduct(id: string, supplierId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Batch tidak ditemukan.`);
    }

    if (product.supplier_id !== supplierId) {
      throw new ForbiddenException(`Anda tidak memiliki akses untuk menghapus batch ini.`);
    }

    // Delete related records
    await this.prisma.qcResult.deleteMany({ where: { product_id: id } });
    await this.prisma.productParameter.deleteMany({ where: { product_id: id } });
    await this.prisma.traceLog.deleteMany({ where: { product_id: id } });

    await this.prisma.product.delete({
      where: { id },
    });

    return { success: true, message: `Batch ${product.batch_code} berhasil dihapus.` };
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
      include: {
        user: {
          include: {
            profile: true,
            products: {
              where: { status: 'VERIFIED' },
              include: { qc_result: true }
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

    return {
      data: {
        ...supplierProfile.user,
        supplier_profile: supplierProfile
      }
    };
  }
}
