import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics() {
    // get pending supplier validation
    const pendingSuppliers = await this.prisma.supplierProfile.count({
      where: {
        status: 'DALAM_VERIFIKASI',
      },
    });

    // get pending QC
    const pendingQc = await this.prisma.product.count({
      where: {
        status: {
          in: ['DRAFT', 'IN_LAB'],
        },
      },
    });

    // get transactions today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const transactionsToday = await this.prisma.order.count({
      where: {
        created_at: {
          gte: today,
        },
      },
    });

    const revenueResult = await this.prisma.order.aggregate({
      where: {
        status: 'COMPLETED',
      },
      _sum: {
        total_amount: true,
      },
    });

    const totalGmv = revenueResult._sum.total_amount || 0;
    const platformCommission = totalGmv * 0.015; // 1.5% Platform Service Fee Commission
    
    // Lab QC Certificate Revenue: Rp 250.000 per certificate issued
    const totalCertificates = await this.prisma.certificate.count();
    const qcRevenue = totalCertificates * 250000;

    const totalRevenue = platformCommission + qcRevenue;

    return {
      pendingSuppliers,
      pendingQc,
      transactionsToday,
      revenue: totalRevenue,
      gmv: totalGmv,
      platformFee: platformCommission,
      qcRevenue,
    };
  }

  async getQcQueue() {
    return this.prisma.product.findMany({
      where: {
        status: {
          in: ['DRAFT', 'IN_LAB'],
        },
      },
      include: {
        supplier: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        created_at: 'asc',
      },
    });
  }

  async validateSupplier(userId: string, action: 'approve' | 'reject') {
    const newStatus = action === 'approve' ? 'active' : 'rejected';
    
    return this.prisma.user.update({
      where: { id: userId },
      data: { status: newStatus },
    });
  }
}
