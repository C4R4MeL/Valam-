import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SupplierStatus } from '@prisma/client';

/**
 * Guard that checks if the supplier is verified (TERVERIFIKASI or LEGACY_VERIFIED).
 * Use on endpoints that require verified supplier status (e.g., product listing).
 * Must be used AFTER JwtAuthGuard and RolesGuard.
 */
@Injectable()
export class SupplierVerifiedGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;

    if (!userId) {
      throw new ForbiddenException('Akses ditolak.');
    }

    const supplier = await this.prisma.supplierProfile.findUnique({
      where: { user_id: userId },
    });

    if (!supplier) {
      throw new ForbiddenException(
        'Profil supplier belum terdaftar. Silakan lengkapi registrasi supplier terlebih dahulu.',
      );
    }

    const allowedStatuses: SupplierStatus[] = [
      SupplierStatus.TERVERIFIKASI,
      SupplierStatus.LEGACY_VERIFIED,
    ];

    if (!allowedStatuses.includes(supplier.status)) {
      const messages: Record<string, string> = {
        TERDAFTAR: 'Lengkapi dan submit dokumen verifikasi Anda terlebih dahulu.',
        DALAM_VERIFIKASI: 'Dokumen Anda sedang dalam proses review oleh Admin Valam. Harap tunggu konfirmasi.',
      };

      throw new ForbiddenException(
        messages[supplier.status] || 'Akses ditolak. Status supplier tidak valid.',
      );
    }

    // Attach supplier to request for downstream use
    request.supplierProfile = supplier;
    return true;
  }
}
