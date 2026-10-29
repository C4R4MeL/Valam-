import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  PartnerDto,
  ReportDto,
  RequestDto,
  ReviewDto,
  TransitionDto,
} from './quality.dto';
import type { Actor } from './quality.policy';
type AuthenticatedRequest = { user: Actor };
import { QualityService } from './quality.service';

async function sendDocument(
  result: Awaited<ReturnType<QualityService['document']>>,
  res: Response,
  download = false,
) {
  res.set({
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': 'sandbox',
    'Referrer-Policy': 'no-referrer',
  });
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="laboratory-source.pdf"`,
  });
  result.stream.on('error', () => {
    if (!res.headersSent) res.status(503).end();
    else res.destroy();
  });
  result.stream!.pipe(res);
}
@Controller('quality')
export class QualityPublicController {
  constructor(private readonly service: QualityService) {}
  @Get('partners') partners() {
    return this.service.partners();
  }
  @Get('batches/:id/reports') reports(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.publicReports(id);
  }
  @Get('reports/:id/source') async source(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
    @Query('download') download?: string,
  ) {
    return sendDocument(await this.service.document(id), res, download === '1');
  }
}
@Controller('quality/manage')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'supplier')
export class QualityController {
  constructor(private readonly service: QualityService) {}
  @Get() list(@Request() req: AuthenticatedRequest) {
    return this.service.list(req.user);
  }
  @Get('partners') partners() {
    return this.service.partners(false, true);
  }
  @Get('issuers') issuers() {
    return this.service.issuers();
  }
  @Get('admin/partners') @Roles('admin') adminPartners() {
    return this.service.partners(true);
  }
  @Get('admin/partners/:id') @Roles('admin') detail(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.partnerDetail(id);
  }
  @Post('admin/partners') @Roles('admin') createPartner(
    @Body() dto: PartnerDto,
  ) {
    return this.service.savePartner(dto);
  }
  @Patch('admin/partners/:id') @Roles('admin') editPartner(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PartnerDto,
  ) {
    return this.service.savePartner(dto, id);
  }
  @Post('requests') @Roles('supplier') createRequest(
    @Request() req: AuthenticatedRequest,
    @Body() dto: RequestDto,
  ) {
    return this.service.createRequest(req.user, dto);
  }
  @Patch('requests/:id') transition(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionDto,
  ) {
    return this.service.transition(req.user, id, dto);
  }
  @Post('batches/:id/files')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  )
  upload(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.upload(req.user, 'batch', id, file);
  }
  @Post('admin/partners/:id/files')
  @Roles('admin')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  )
  agreement(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.upload(req.user, 'partner', id, file);
  }
  @Get('admin/agreements/:id/source') @Roles('admin') async readAgreement(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    return sendDocument(await this.service.agreement(id, req.user), res);
  }
  @Post('reports') report(
    @Request() req: AuthenticatedRequest,
    @Body() dto: ReportDto,
  ) {
    return this.service.createReport(req.user, dto);
  }
  @Patch('reports/:id/review') @Roles('admin') review(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewDto,
  ) {
    return this.service.review(req.user, id, dto);
  }
  @Get('reports/:id/source') async source(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
    @Query('download') download?: string,
  ) {
    return sendDocument(
      await this.service.document(id, req.user),
      res,
      download === '1',
    );
  }
}
