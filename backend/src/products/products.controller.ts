import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SupplierVerifiedGuard } from '../supplier/guards/supplier-verified.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }
  
  @Post('batches')
  @UseGuards(JwtAuthGuard, RolesGuard, SupplierVerifiedGuard)
  @Roles('supplier')
  createBatch(@Request() req: any, @Body() createBatchDto: any) {
    return this.productsService.createBatch(req.user.userId, createBatchDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, SupplierVerifiedGuard)
  @Roles('supplier')
  updateProduct(@Request() req: any, @Param('id') id: string, @Body() updateDto: any) {
    return this.productsService.updateProduct(id, req.user.userId, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, SupplierVerifiedGuard)
  @Roles('supplier')
  deleteProduct(@Request() req: any, @Param('id') id: string) {
    return this.productsService.deleteProduct(id, req.user.userId);
  }

  @Patch(':id/price')
  @UseGuards(JwtAuthGuard, RolesGuard, SupplierVerifiedGuard)
  @Roles('supplier')
  setPrice(@Request() req: any, @Param('id') id: string, @Body('price') price: number) {
    return this.productsService.setPrice(id, req.user.userId, price);
  }

  @Get('suppliers/:id')
  getPublicSupplierProfile(@Param('id') id: string) {
    return this.productsService.getPublicSupplierProfile(id);
  }
}

