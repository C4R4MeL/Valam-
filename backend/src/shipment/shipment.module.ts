import { Module } from '@nestjs/common';
import { ShipmentService } from './shipment.service';
import { ShipmentController } from './shipment.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { BiteshipService } from './biteship.service';
import { DocumentHelper } from './document.helper';

@Module({
  imports: [PrismaModule, SupabaseModule],
  providers: [ShipmentService, BiteshipService, DocumentHelper],
  controllers: [ShipmentController],
  exports: [ShipmentService]
})
export class ShipmentModule {}
