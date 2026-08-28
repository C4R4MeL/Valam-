import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CircularProductsService {
  constructor(private prisma: PrismaService) {}

  async findAllApproved(category?: string, search?: string) {
    const whereClause: any = {
      status: 'APPROVED',
    };

    if (category) {
      whereClause.category = category;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.circularProduct.findMany({
      where: whereClause,
      include: {
        supplier: {
          include: {
            profile: true,
            supplier_profile: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const product = await this.prisma.circularProduct.findFirst({
      where: isUuid
        ? {
            OR: [
              { id },
              { name: id }
            ]
          }
        : {
            name: id
          },
      include: {
        supplier: {
          include: {
            profile: true,
            supplier_profile: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Circular product not found');
    }

    return product;
  }

  async findBySupplier(supplierId: string) {
    return this.prisma.circularProduct.findMany({
      where: { supplier_id: supplierId },
      orderBy: { created_at: 'desc' },
    });
  }

  async getSupplierMetrics(supplierId: string) {
    // 1. Total Products
    const total = await this.prisma.circularProduct.count({
      where: { supplier_id: supplierId },
    });

    // 2. Sold Items & Revenue
    // Fetch order items containing this supplier's circular products
    const soldItems = await this.prisma.orderItem.findMany({
      where: {
        circular_product: {
          supplier_id: supplierId,
        },
        order: {
          status: {
            in: ['PENDING', 'PACKED', 'SHIPPED', 'COMPLETED'],
          },
        },
      },
    });

    const soldCount = soldItems.reduce((acc, item) => acc + item.quantity_kg, 0);
    const revenue = soldItems.reduce((acc, item) => acc + item.subtotal, 0);

    return {
      totalProducts: total,
      circularProductsSold: soldCount,
      circularProductRevenue: revenue,
    };
  }

  async create(supplierId: string, dto: any) {
    return this.prisma.circularProduct.create({
      data: {
        supplier_id: supplierId,
        name: dto.name,
        category: dto.category,
        description: dto.description,
        benefit: dto.benefit,
        price: Number(dto.price),
        stock: Number(dto.stock),
        unit: dto.unit,
        image: dto.image || '',
        status: 'DRAFT',
      },
    });
  }

  async update(supplierId: string, id: string, dto: any) {
    const product = await this.prisma.circularProduct.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Circular product not found');
    }

    if (product.supplier_id !== supplierId) {
      throw new BadRequestException('Not authorized to edit this product');
    }

    return this.prisma.circularProduct.update({
      where: { id },
      data: {
        name: dto.name,
        category: dto.category,
        description: dto.description,
        benefit: dto.benefit,
        price: Number(dto.price),
        stock: Number(dto.stock),
        unit: dto.unit,
        image: dto.image !== undefined ? dto.image : product.image,
        // If updating a rejected product, reset it to DRAFT
        status: product.status === 'REJECTED' ? 'DRAFT' : product.status,
        rejection_reason: product.status === 'REJECTED' ? '' : product.rejection_reason,
      },
    });
  }

  async delete(supplierId: string, id: string) {
    const product = await this.prisma.circularProduct.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Circular product not found');
    }

    if (product.supplier_id !== supplierId) {
      throw new BadRequestException('Not authorized to delete this product');
    }

    return this.prisma.circularProduct.delete({
      where: { id },
    });
  }

  async submitForVerification(supplierId: string, id: string) {
    const product = await this.prisma.circularProduct.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Circular product not found');
    }

    if (product.supplier_id !== supplierId) {
      throw new BadRequestException('Not authorized to submit this product');
    }

    if (product.status !== 'DRAFT' && product.status !== 'REJECTED') {
      throw new BadRequestException('Only DRAFT or REJECTED products can be submitted');
    }

    return this.prisma.circularProduct.update({
      where: { id },
      data: {
        status: 'PENDING',
        rejection_reason: '',
      },
    });
  }

  // Admin methods
  async findAllAdmin() {
    return this.prisma.circularProduct.findMany({
      include: {
        supplier: {
          include: {
            profile: true,
            supplier_profile: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async reviewProduct(id: string, action: 'approve' | 'reject', rejectionReason?: string) {
    const product = await this.prisma.circularProduct.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Circular product not found');
    }

    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

    return this.prisma.circularProduct.update({
      where: { id },
      data: {
        status: newStatus,
        rejection_reason: action === 'reject' ? rejectionReason : '',
      },
    });
  }

  async updateCategoryByAdmin(id: string, category: string) {
    const product = await this.prisma.circularProduct.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Circular product not found');
    }

    return this.prisma.circularProduct.update({
      where: { id },
      data: { category },
    });
  }
}
