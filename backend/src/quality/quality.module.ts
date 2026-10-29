import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { SupplierStorageService } from '../supplier/supplier-storage.service';
import { QualityService } from './quality.service';
import {
  QualityController,
  QualityPublicController,
} from './quality.controller';
@Module({
  imports: [PrismaModule, SupabaseModule],
  controllers: [QualityController, QualityPublicController],
  providers: [QualityService, SupplierStorageService],
  exports: [QualityService],
})
export class QualityModule {}
