import { Controller, Post, Get, Put, Body, UseGuards, Param, Request } from '@nestjs/common';
import { RfqService, SubmitRfqDto, RespondRfqDto } from './rfq.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('rfq')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RfqController {
  constructor(private readonly rfqService: RfqService) {}

  @Post()
  @Roles('buyer')
  async submitRfq(@Request() req: any, @Body() dto: SubmitRfqDto) {
    const result = await this.rfqService.submitRfq(req.user.userId, dto);
    return { message: 'RFQ submitted successfully', data: result };
  }

  @Get('buyer')
  @Roles('buyer')
  async getBuyerRfqs(@Request() req: any) {
    const result = await this.rfqService.getBuyerRfqs(req.user.userId);
    return { data: result };
  }

  @Get('supplier')
  @Roles('supplier')
  async getSupplierRfqs(@Request() req: any) {
    const result = await this.rfqService.getSupplierRfqs(req.user.userId);
    return { data: result };
  }

  @Put(':id/respond')
  @Roles('supplier')
  async respondToRfq(@Request() req: any, @Param('id') rfqId: string, @Body() dto: RespondRfqDto) {
    const result = await this.rfqService.respondToRfq(req.user.userId, rfqId, dto);
    return { message: 'RFQ responded successfully', data: result };
  }

  @Put(':id/close')
  @Roles('buyer')
  async closeRfq(@Request() req: any, @Param('id') rfqId: string, @Body() body: { status: 'ACCEPTED' | 'REJECTED' }) {
    const result = await this.rfqService.closeRfq(req.user.userId, rfqId, body.status);
    return { message: 'RFQ status updated successfully', data: result };
  }
}
