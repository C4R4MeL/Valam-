import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('cart')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @Roles('BUYER')
  async getCart(@Request() req: any) {
    return this.cartService.getCart(req.user.userId);
  }

  @Post()
  @Roles('BUYER')
  async addToCart(
    @Request() req: any, 
    @Body() body: { 
      productId?: string; 
      product_id?: string; 
      circular_product_id?: string; 
      circularProductId?: string;
      quantity_kg?: number; 
      quantity?: number;
    }
  ) {
    const targetId = body.productId || body.circular_product_id || body.circularProductId || body.product_id;
    const qty = Number(body.quantity_kg ?? body.quantity ?? 1);
    return this.cartService.addToCart(req.user.userId, targetId as string, qty);
  }

  @Put(':id')
  @Roles('BUYER')
  async updateQuantity(@Request() req: any, @Param('id') id: string, @Body() body: { quantity_kg: number }) {
    return this.cartService.updateQuantity(req.user.userId, id, body.quantity_kg);
  }

  @Delete(':id')
  @Roles('BUYER')
  async removeItem(@Request() req: any, @Param('id') id: string) {
    return this.cartService.removeItem(req.user.userId, id);
  }
}
