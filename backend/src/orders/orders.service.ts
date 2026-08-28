import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService
  ) {}

  async checkout(userId: string, data: any) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { user_id: userId },
      include: { product: true, circular_product: true }
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Calculate total
    let subtotal = 0;
    cartItems.forEach(item => {
      if (item.product_id) {
        subtotal += item.quantity_kg * item.product!.price_per_kg;
      } else if (item.circular_product_id) {
        subtotal += item.quantity_kg * item.circular_product!.price;
      }
    });

    // In MVP, we assume all items in cart go to one supplier. We pick the supplier from first item
    const supplierId = cartItems[0].product_id 
      ? cartItems[0].product!.supplier_id 
      : cartItems[0].circular_product!.supplier_id;

    const shippingCost = Number(data.shipping_cost) || 0;
    const shippingAddress = data.shipping_address ? { address: data.shipping_address } : {};

    // Create Order
    const order = await this.prisma.order.create({
      data: {
        order_number: 'ORD-' + Date.now().toString(),
        buyer_id: userId,
        supplier_id: supplierId,
        total_amount: subtotal,
        shipping_cost: shippingCost,
        shipping_address: shippingAddress,
        status: 'UNPAID', // Wait for payment
        items: {
          create: cartItems.map(item => ({
            product_id: item.product_id,
            circular_product_id: item.circular_product_id,
            quantity_kg: item.quantity_kg,
            price_per_kg: item.product_id ? item.product!.price_per_kg : item.circular_product!.price,
            subtotal: item.product_id 
              ? item.quantity_kg * item.product!.price_per_kg 
              : item.quantity_kg * item.circular_product!.price
          }))
        }
      }
    });

    // Create initial Shipment record
    await this.prisma.shipment.create({
      data: {
        order_id: order.id,
        shipment_type: data.shipping_method === 'OCEAN_FREIGHT' ? 'EKSPOR' : 'DOMESTIK',
        courier_name: data.shipping_courier === 'jne_jtr' ? 'JNE JTR' : data.shipping_courier === 'sea_freight' ? 'Sea Freight Cargo' : 'Biteship Cargo (Truk)',
        courier_code: data.shipping_courier || 'cargo_truck',
        total_shipping_cost: shippingCost,
        actual_weight: cartItems.reduce((acc, item) => acc + item.quantity_kg, 0),
        origin_address: {},
        destination_address: {}
      }
    });

    // Create Payment record
    const payment = await this.prisma.payment.create({
      data: {
        order_id: order.id,
        amount: subtotal + shippingCost,
        status: 'PENDING',
        payment_method: data.payment_method || 'ESCROW'
      }
    });

    // Generate Midtrans Snap Token
    const buyer = await this.prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    
    const customerDetails = {
      firstName: buyer?.profile?.contact_person || 'Buyer',
      lastName: '',
      email: buyer?.email,
      phone: buyer?.profile?.phone || '08123456789'
    };

    const paymentItems = cartItems.map(item => ({
      id: item.product_id || item.circular_product_id!,
      price: item.product_id ? item.product!.price_per_kg : item.circular_product!.price,
      quantity: item.quantity_kg,
      name: item.product_id 
        ? `Minyak Nilam Batch ${item.product!.batch_code}` 
        : `${item.circular_product!.name}`
    }));

    if (shippingCost > 0) {
      paymentItems.push({
        id: 'shipping-fee',
        price: shippingCost,
        quantity: 1,
        name: `Biaya Pengiriman Kargo`
      });
    }

    const snapToken = await this.paymentService.createTransaction(
      order.id, 
      subtotal + shippingCost, 
      customerDetails, 
      paymentItems
    );

    // Clear Cart
    await this.prisma.cartItem.deleteMany({
      where: { user_id: userId }
    });

    // Decrease stock (Reserve)
    for (const item of cartItems) {
      if (item.product_id) {
        await this.prisma.product.update({
          where: { id: item.product_id },
          data: {
            available_volume_kg: {
              decrement: item.quantity_kg
            }
          }
        });
      } else if (item.circular_product_id) {
        await this.prisma.circularProduct.update({
          where: { id: item.circular_product_id },
          data: {
            stock: {
              decrement: item.quantity_kg
            }
          }
        });
      }
    }

    return {
      orderId: order.id,
      snapToken
    };
  }

  async getBuyerOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { buyer_id: userId },
      include: {
        items: {
          include: { product: true, circular_product: true }
        },
        payment: true,
        shipment: {
          include: {
            tracking_logs: {
              orderBy: { created_at: 'desc' }
            }
          }
        },
        supplier: { include: { profile: true } }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async getSupplierOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { supplier_id: userId },
      include: {
        items: {
          include: { product: true, circular_product: true }
        },
        payment: true,
        shipment: {
          include: {
            tracking_logs: {
              orderBy: { created_at: 'desc' }
            }
          }
        },
        buyer: { include: { profile: true } }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async updateOrderStatus(supplierId: string, orderId: string, status: string, note?: string, delivery_proof_url?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.supplier_id !== supplierId) {
      throw new BadRequestException('Unauthorized to update this order');
    }

    const validStatuses = ['PENDING', 'PACKED', 'SHIPPED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    // Require delivery proof photo when marking as COMPLETED
    if (status === 'COMPLETED' && !delivery_proof_url) {
      throw new BadRequestException('Bukti foto barang sampai wajib diunggah sebelum menandai pesanan selesai.');
    }

    const updateData: any = { status };
    if (status === 'COMPLETED' && delivery_proof_url) {
      updateData.delivery_proof_url = delivery_proof_url;
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: updateData
    });

    // Restore stock if cancelled
    if (status === 'CANCELLED') {
      const orderWithItems = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });
      if (orderWithItems && orderWithItems.items) {
        for (const item of orderWithItems.items) {
          if (item.product_id) {
            await this.prisma.product.update({
              where: { id: item.product_id },
              data: {
                available_volume_kg: {
                  increment: item.quantity_kg
                }
              }
            });
          } else if (item.circular_product_id) {
            await this.prisma.circularProduct.update({
              where: { id: item.circular_product_id },
              data: {
                stock: {
                  increment: item.quantity_kg
                }
              }
            });
          }
        }
      }
    }

    // Create tracking log if shipment exists
    const shipment = await this.prisma.shipment.findUnique({
      where: { order_id: orderId }
    });
    if (shipment) {
      await this.prisma.shipmentTrackingLog.create({
        data: {
          shipment_id: shipment.id,
          status: status,
          description: note || `Pesanan diubah statusnya menjadi ${status}`
        }
      });
    }

    // If completed, add funds to supplier wallet
    if (status === 'COMPLETED') {
      await this.addFundsToWallet(supplierId, order.total_amount, order.id);
    }

    return updatedOrder;
  }

  private async addFundsToWallet(supplierId: string, amount: number, orderId: string) {
    // Check if wallet exists
    let wallet = await this.prisma.wallet.findUnique({
      where: { user_id: supplierId }
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { user_id: supplierId, balance: 0 }
      });
    }

    // Add transaction
    await this.prisma.walletTransaction.create({
      data: {
        wallet_id: wallet.id,
        type: 'CREDIT',
        amount: amount,
        description: `Pembayaran Pesanan #${orderId.substring(0, 8)}`
      }
    });

    // Update balance
    await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: amount } }
    });
  }

  async updateOrderShipping(userId: string, orderId: string, data: { shipping_address: string; shipping_cost: number }) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.buyer_id !== userId) throw new ForbiddenException('Not your order');

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        shipping_cost: data.shipping_cost,
        shipping_address: { address: data.shipping_address }
      }
    });
  }

  async payOrder(userId: string, orderId: string, paymentMethod: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.buyer_id !== userId) throw new ForbiddenException('Not your order');

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PENDING',
        payment_status: 'PAID'
      }
    });

    await this.prisma.payment.updateMany({
      where: { order_id: orderId },
      data: {
        status: 'PAID',
        payment_method: paymentMethod,
        paid_at: new Date()
      }
    });

    return updated;
  }

  async completeOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId }
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyer_id !== userId) throw new ForbiddenException('Not your order');

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED'
      }
    });

    // Add tracking log
    const shipment = await this.prisma.shipment.findFirst({
      where: { order_id: orderId }
    });
    if (shipment) {
      await this.prisma.shipmentTrackingLog.create({
        data: {
          shipment_id: shipment.id,
          status: 'COMPLETED',
          description: 'Pesanan telah diterima oleh pembeli. Transaksi berhasil diselesaikan.'
        }
      });
    }

    // Release escrow to supplier wallet
    await this.addFundsToWallet(order.supplier_id, order.total_amount, order.id);

    return updated;
  }

  async resetOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.buyer_id !== userId && order.supplier_id !== userId) {
      throw new ForbiddenException('Not your order');
    }

    // Delete related shipments & tracking logs
    const shipment = await this.prisma.shipment.findFirst({
      where: { order_id: orderId }
    });
    if (shipment) {
      await this.prisma.shipmentTrackingLog.deleteMany({
        where: { shipment_id: shipment.id }
      });
      await this.prisma.shipment.delete({
        where: { id: shipment.id }
      });
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'UNPAID',
        shipping_cost: 0,
        shipping_address: {},
        payment_status: 'PENDING'
      }
    });

    await this.prisma.payment.updateMany({
      where: { order_id: orderId },
      data: {
        status: 'pending',
        payment_method: null,
        paid_at: null
      }
    });

    return updated;
  }
}
