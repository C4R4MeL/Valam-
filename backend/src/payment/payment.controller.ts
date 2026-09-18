import { Controller, Post, Get, Body, Param, UseGuards, Request, HttpCode } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Midtrans Webhook Notification endpoint.
   * NO auth guard — Midtrans sends notifications server-to-server.
   * Always returns HTTP 200 to acknowledge receipt.
   */
  @Post('notification')
  @HttpCode(200)
  async handleNotification(@Body() body: any) {
    return this.paymentService.handleNotification(body);
  }

  /**
   * Get payment status for a specific order.
   * Used by frontend to poll after snap.pay() completes.
   * Requires authentication — only the buyer should access this.
   */
  @Get('status/:orderId')
  @UseGuards(JwtAuthGuard)
  async getPaymentStatus(
    @Param('orderId') orderId: string,
    @Request() req: any,
  ) {
    const status = await this.paymentService.getPaymentStatus(orderId);
    if (!status) {
      return { error: 'Order not found' };
    }
    return status;
  }
}
