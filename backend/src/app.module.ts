import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { SupabaseModule } from './supabase/supabase.module';
import { ProductsModule } from './products/products.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { QcModule } from './qc/qc.module';
import { TraceabilityModule } from './traceability/traceability.module';
import { CartModule } from './cart/cart.module';
import { PaymentModule } from './payment/payment.module';
import { OrdersModule } from './orders/orders.module';
import { ShipmentModule } from './shipment/shipment.module';
import { WalletModule } from './wallet/wallet.module';
import { MatchingModule } from './matching/matching.module';
import { RfqModule } from './rfq/rfq.module';
import { ChatModule } from './chat/chat.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SupplierModule } from './supplier/supplier.module';
import { CircularProductsModule } from './circular-products/circular-products.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 60,
    }]),
    PrismaModule, 
    AuthModule, 
    UsersModule, 
    ProfilesModule, 
    SupabaseModule, 
    ProductsModule,
    AdminModule,
    QcModule,
    TraceabilityModule,
    CartModule,
    PaymentModule,
    OrdersModule,
    ShipmentModule,
    WalletModule,
    MatchingModule,
    RfqModule,
    ChatModule,
    ScheduleModule.forRoot(),
    SupplierModule,
    CircularProductsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ],
})
export class AppModule {}
