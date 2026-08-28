import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
