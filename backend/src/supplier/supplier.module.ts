import { Module } from '@nestjs/common';
import { SupplierController } from './supplier.controller';
import { SupplierAdminController } from './supplier-admin.controller';
import { SupplierService } from './supplier.service';
import { SupplierStorageService } from './supplier-storage.service';
import { SupplierCronService } from './supplier-cron.service';
import { NotificationService } from './notification.service';
import { SupplierVerifiedGuard } from './guards/supplier-verified.guard';

@Module({
  controllers: [SupplierController, SupplierAdminController],
  providers: [
    SupplierService,
    SupplierStorageService,
    SupplierCronService,
    NotificationService,
    SupplierVerifiedGuard,
  ],
  exports: [SupplierService, SupplierVerifiedGuard],
})
export class SupplierModule {}
