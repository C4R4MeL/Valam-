import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentModule } from '../payment/payment.module';
import { ShipmentModule } from '../shipment/shipment.module';

@Module({
  imports: [PrismaModule, PaymentModule, ShipmentModule],
  providers: [OrdersService],
  controllers: [OrdersController]
})
export class OrdersModule {}
