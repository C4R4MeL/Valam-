import { Controller, Get, Param, Res } from '@nestjs/common';
import { TraceabilityService } from './traceability.service';
import type { Response } from 'express';

@Controller('trace')
export class TraceabilityController {
  constructor(private readonly traceabilityService: TraceabilityService) {}

  @Get(':batchId')
  getTraceInfo(@Param('batchId') batchId: string) {
    return this.traceabilityService.getTraceabilityInfo(batchId);
  }

  @Get('code/:batchCode')
  getTraceInfoByCode(@Param('batchCode') batchCode: string) {
    return this.traceabilityService.getTraceabilityInfoByBatchCode(batchCode);
  }

  @Get(':batchId/qr')
  async downloadQr(@Param('batchId') batchId: string, @Res() res: Response) {
    const qrBuffer = await this.traceabilityService.generateTraceQrCode(batchId);

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `inline; filename="QR-${batchId}.png"`,
      'Content-Length': qrBuffer.length,
    });

    res.end(qrBuffer);
  }
}
