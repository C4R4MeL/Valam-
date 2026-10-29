import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PUBLIC_USER_SELECT } from '../users/public-user.select';

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
    const pendingQc = await this.prisma.testingRequest.count({
      where: {
        status: {
          notIn: ['RESULTS_AVAILABLE', 'CANCELLED'],
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
    
    // Testing fees/revenue have not been configured or reconciled.
    const qcRevenue = null;
    const totalRevenue = platformCommission;

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
        supplier: { select: PUBLIC_USER_SELECT },
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
      select: { id: true, status: true },
    });
  }
}
