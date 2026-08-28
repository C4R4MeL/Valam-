import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards, Request, Res, HttpCode, HttpStatus } from '@nestjs/common';
import * as express from 'express';
import { ShipmentService } from './shipment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ConfirmOngkirDto, EksporShippingDto, ReportMasalahDto, ResolveMasalahDto, ConfirmPickupDto } from './dto/shipment.dto';

@Controller('shipment')
export class ShipmentController {
  constructor(private readonly shipmentService: ShipmentService) {}

  // Webhook public (unprotected)
  @Post('webhook/biteship')
  @HttpCode(HttpStatus.OK)
  async handleBiteshipWebhook(@Body() body: any) {
    return this.shipmentService.handleBiteshipWebhook(body);
  }

  // Buyer: get rates
  @Get('rates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUYER')
  async getRates(@Request() req: any, @Query('orderId') orderId: string) {
    return this.shipmentService.getOngkirOptions(orderId, req.user.userId);
  }

  // Buyer: lock shipping cost
  @Post('confirm-ongkir')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUYER')
  async confirmOngkir(@Request() req: any, @Body() body: ConfirmOngkirDto) {
    return this.shipmentService.confirmOngkir(body.orderId, body.selectedRateId, req.user.userId);
  }

  // Buyer: submit export parameters
  @Post('ekspor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUYER')
  async submitEkspor(@Request() req: any, @Body() body: EksporShippingDto) {
    return this.shipmentService.submitEksporShipping(body.orderId, body, req.user.userId);
  }

  // Buyer: confirm delivery received
  @Post(':id/confirm-received')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUYER')
  async confirmReceived(@Request() req: any, @Param('id') id: string) {
    return this.shipmentService.confirmReceived(id, req.user.userId);
  }

  // Buyer/Supplier: report shipping issue
  @Post(':id/report-masalah')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUYER', 'SUPPLIER')
  async reportMasalah(@Request() req: any, @Param('id') id: string, @Body() body: ReportMasalahDto) {
    return this.shipmentService.reportMasalah(id, body.catatan, req.user.userId);
  }

  // Buyer/Supplier/Admin: tracking status
  @Get(':id/tracking')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getTracking(@Request() req: any, @Param('id') id: string) {
    return this.shipmentService.getTracking(id, req.user.userId);
  }

  // Supplier: confirm shipment picked up
  @Post(':id/confirm-pickup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPPLIER')
  async confirmPickup(@Request() req: any, @Param('id') id: string, @Body() body: ConfirmPickupDto) {
    return this.shipmentService.confirmPickup(id, req.user.userId, body?.pickupPhoto);
  }

  // Supplier: update export ocean tracking
  @Put(':id/tracking-ekspor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPPLIER')
  async updateEksporTracking(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.shipmentService.updateEksporTracking(id, body, req.user.userId);
  }

  // Supplier: list supplier shipments
  @Get('my-orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPPLIER')
  async getSupplierShipments(@Request() req: any) {
    return this.shipmentService.getSupplierShipments(req.user.userId);
  }

  // Admin: list all shipments
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAdminShipments(@Query('status') status?: string, @Query('type') type?: string) {
    return this.shipmentService.getAdminShipments(status, type);
  }

  // Admin: shipment details
  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAdminShipmentDetails(@Param('id') id: string) {
    return this.shipmentService.getAdminShipmentDetails(id);
  }

  // Admin: resolve issue
  @Patch('admin/:id/resolve-masalah')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async resolveIssue(@Param('id') id: string, @Body() body: ResolveMasalahDto) {
    return this.shipmentService.resolveMasalah(id, body.aksi, body.catatan);
  }

  // Document downloads
  @Get(':id/documents/:type')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async downloadDocument(@Param('id') id: string, @Param('type') type: string, @Res() res: express.Response) {
    return this.shipmentService.downloadDocument(id, type, res);
  }
}
