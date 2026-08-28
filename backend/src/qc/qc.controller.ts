import { Controller, Get, Post, Patch, Body, Param, Res } from '@nestjs/common';
import { QcService } from './qc.service';
import type { Response } from 'express';

@Controller()
export class QcController {
  constructor(private readonly qcService: QcService) {}

  @Post('admin/qc/:batchId')
  createQc(
    @Param('batchId') batchId: string,
    @Body() data: any,
  ) {
    // In a real app we would get adminId from JWT user payload
    const adminId = data.adminId || '00000000-0000-0000-0000-000000000000'; // mock
    return this.qcService.createQcResult(batchId, adminId, data);
  }

  @Patch('admin/qc/:batchId/receive')
  receiveSample(@Param('batchId') batchId: string) {
    return this.qcService.receiveSample(batchId);
  }

  @Get('products/:id/coa')
  getCoaInfo(@Param('id') id: string) {
    return this.qcService.getDigitalCoa(id);
  }

  @Get('products/:id/coa/download')
  async downloadCoa(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.qcService.generatePdf(id);
    const coa = await this.qcService.getDigitalCoa(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${coa.certificate_number}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
