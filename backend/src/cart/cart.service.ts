import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  private isValidUUID(str: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  }

  async getCart(userId: string) {
    const items = await this.prisma.cartItem.findMany({
      where: { user_id: userId },
      include: {
        product: {
          include: {
            supplier: {
              include: { profile: true }
            }
          }
        },
        circular_product: {
          include: {
            supplier: {
              include: { profile: true }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    let subtotal = 0;
    const formattedItems = [];

    for (const item of items) {
      if (item.product_id) {
        const prod = item.product!;
        const itemSubtotal = item.quantity_kg * prod.price_per_kg;
        subtotal += itemSubtotal;
        formattedItems.push({
          id: item.id,
          product_id: item.product_id,
          circular_product_id: null,
          quantity_kg: item.quantity_kg,
          is_circular: false,
          product: {
            batch_code: prod.batch_code,
            price_per_kg: prod.price_per_kg,
            available_volume_kg: prod.available_volume_kg,
            moq_kg: prod.moq_kg,
            images: prod.images,
            supplier: {
              company_name: prod.supplier.profile?.company_name || 'N/A'
            }
          },
          subtotal: itemSubtotal
        });
      } else if (item.circular_product_id) {
        const circ = item.circular_product!;
        const itemSubtotal = item.quantity_kg * circ.price;
        subtotal += itemSubtotal;
        formattedItems.push({
          id: item.id,
          product_id: null,
          circular_product_id: item.circular_product_id,
          quantity_kg: item.quantity_kg,
          is_circular: true,
          product: {
            batch_code: circ.name,
            price_per_kg: circ.price,
            available_volume_kg: circ.stock,
            moq_kg: 1.0,
            images: circ.image ? [circ.image] : [],
            supplier: {
              company_name: circ.supplier.profile?.company_name || 'N/A'
            }
          },
          subtotal: itemSubtotal
        });
      }
    }

    return {
      items: formattedItems,
      total_amount: subtotal,
      total_items: formattedItems.length
    };
  }

  async addToCart(userId: string, productId: string, quantity_kg: number) {
    if (!this.isValidUUID(productId)) {
      throw new NotFoundException('Product not found (invalid ID format)');
    }

    // 1. Try finding in CircularProduct table first
    const circularProduct = await this.prisma.circularProduct.findUnique({
      where: { id: productId }
    });

    if (circularProduct) {
      if (circularProduct.status !== 'APPROVED') {
        throw new BadRequestException('Circular product is not available for purchase');
      }

      if (quantity_kg < 1.0) {
        throw new BadRequestException(`Minimum order quantity is 1 unit`);
      }

      if (quantity_kg > circularProduct.stock) {
        throw new BadRequestException(`Only ${circularProduct.stock} available in stock`);
      }

      // Check if already in cart
      const existingItem = await this.prisma.cartItem.findFirst({
        where: { user_id: userId, circular_product_id: productId }
      });

      if (existingItem) {
        const newQuantity = existingItem.quantity_kg + quantity_kg;
        if (newQuantity > circularProduct.stock) {
          throw new BadRequestException(`Cannot add more. Only ${circularProduct.stock} available in stock`);
        }
        return this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity_kg: newQuantity }
        });
      }

      return this.prisma.cartItem.create({
        data: {
          user_id: userId,
          circular_product_id: productId,
          product_id: null,
          quantity_kg
        }
      });
    }

    // 2. Standard Oil Product fallback
    const product = await this.prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.status !== 'VERIFIED') {
      throw new BadRequestException('Product is not available for purchase');
    }

    if (quantity_kg < product.moq_kg) {
      throw new BadRequestException(`Minimum order quantity is ${product.moq_kg} kg`);
    }

    if (quantity_kg > product.available_volume_kg) {
      throw new BadRequestException(`Only ${product.available_volume_kg} kg available in stock`);
    }

    // Check if already in cart
    const existingItem = await this.prisma.cartItem.findFirst({
      where: { user_id: userId, product_id: productId }
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity_kg + quantity_kg;
      if (newQuantity > product.available_volume_kg) {
        throw new BadRequestException(`Cannot add more. Only ${product.available_volume_kg} kg available in stock`);
      }
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity_kg: newQuantity }
      });
    }

    return this.prisma.cartItem.create({
      data: {
        user_id: userId,
        product_id: productId,
        circular_product_id: null,
        quantity_kg
      }
    });
  }

  async updateQuantity(userId: string, itemId: string, quantity_kg: number) {
    if (!this.isValidUUID(itemId)) {
      throw new NotFoundException('Cart item not found (invalid ID format)');
    }

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, user_id: userId },
      include: {
        product: true,
        circular_product: true
      }
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    if (item.product_id) {
      const prod = item.product!;
      if (quantity_kg < prod.moq_kg) {
        throw new BadRequestException(`Minimum order quantity is ${prod.moq_kg} kg`);
      }

      if (quantity_kg > prod.available_volume_kg) {
        throw new BadRequestException(`Only ${prod.available_volume_kg} kg available in stock`);
      }
    } else if (item.circular_product_id) {
      const circ = item.circular_product!;
      if (quantity_kg < 1.0) {
        throw new BadRequestException(`Minimum order quantity is 1 unit`);
      }

      if (quantity_kg > circ.stock) {
        throw new BadRequestException(`Only ${circ.stock} available in stock`);
      }
    }

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity_kg }
    });
  }

  async removeItem(userId: string, itemId: string) {
    if (!this.isValidUUID(itemId)) {
      throw new NotFoundException('Cart item not found (invalid ID format)');
    }

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, user_id: userId }
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId }
    });

    return { success: true };
  }
}
