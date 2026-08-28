import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CircularProductsController } from './circular-products.controller';
import { CircularProductsService } from './circular-products.service';

@Module({
  imports: [PrismaModule],
  controllers: [CircularProductsController],
  providers: [CircularProductsService],
  exports: [CircularProductsService],
})
export class CircularProductsModule {}
