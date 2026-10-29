import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminService } from './admin.service';
import { ProductsService } from '../products/products.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService, private readonly productsService: ProductsService) {}

  @Get('qc/products')
  getQcProducts() {
    return this.productsService.findAll({}, undefined, true);
  }

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboardMetrics();
  }

  @Get('qc/queue')
  getQcQueue() {
    return this.adminService.getQcQueue();
  }

  @Post('suppliers/:id/validate')
  validateSupplier(
    @Param('id') id: string,
    @Body('action') action: 'approve' | 'reject',
  ) {
    return this.adminService.validateSupplier(id, action);
  }
}
