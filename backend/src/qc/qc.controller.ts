import { Controller, Get, Post, Patch, Body, Param, Res, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { QcService } from './qc.service';
import type { Response } from 'express';
import { RecordQcDto } from './qc.dto';

@Controller()
export class QcController {
  constructor(private readonly qcService: QcService) {}

  @Post('admin/qc/:batchId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  createQc(
    @Param('batchId') batchId: string,
    @Body() data: RecordQcDto,
    @Request() req: any,
  ) {
    return this.qcService.createQcResult(batchId, req.user.userId, data);
  }

  @Patch('admin/qc/:batchId/receive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
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
