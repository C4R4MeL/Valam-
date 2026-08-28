import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  @Roles('BUYER')
  async checkout(@Request() req: any, @Body() body: any) {
    return this.ordersService.checkout(req.user.userId, body);
  }

  @Get('buyer')
  @Roles('BUYER')
  async getBuyerOrders(@Request() req: any) {
    return this.ordersService.getBuyerOrders(req.user.userId);
  }

  @Get('supplier')
  @Roles('SUPPLIER')
  async getSupplierOrders(@Request() req: any) {
    return this.ordersService.getSupplierOrders(req.user.userId);
  }

  @Put('supplier/:id/status')
  @Roles('SUPPLIER')
  async updateOrderStatus(@Request() req: any, @Param('id') id: string, @Body() body: { status: string; note?: string; delivery_proof_url?: string }) {
    return this.ordersService.updateOrderStatus(req.user.userId, id, body.status, body.note, body.delivery_proof_url);
  }

  @Put(':id/shipping')
  @Roles('BUYER')
  async updateOrderShipping(
    @Request() req: any, 
    @Param('id') orderId: string, 
    @Body() body: { shipping_address: string; shipping_cost: number }
  ) {
    return this.ordersService.updateOrderShipping(req.user.userId, orderId, body);
  }

  @Put(':id/pay')
  @Roles('BUYER')
  async payOrder(
    @Request() req: any, 
    @Param('id') orderId: string, 
    @Body() body: { payment_method: string }
  ) {
    return this.ordersService.payOrder(req.user.userId, orderId, body.payment_method);
  }

  @Put(':id/complete')
  @Roles('BUYER')
  async completeOrder(@Request() req: any, @Param('id') orderId: string) {
    return this.ordersService.completeOrder(req.user.userId, orderId);
  }

  @Put(':id/reset')
  @Roles('BUYER', 'SUPPLIER')
  async resetOrder(@Request() req: any, @Param('id') orderId: string) {
    return this.ordersService.resetOrder(req.user.userId, orderId);
  }
}
