import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SupplierService } from './supplier.service';
import { ReviewDocumentDto } from './dto/review-document.dto';
import { LegacyMigrationDto } from './dto/legacy-migration.dto';
import { SupplierStatus } from '@prisma/client';

@ApiTags('Admin — Supplier Verification')
@ApiBearerAuth()
@Controller('admin/suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SupplierAdminController {
  constructor(private readonly supplierService: SupplierService) {}

  @Get()
  @ApiOperation({ summary: 'List all suppliers with filtering' })
  async listSuppliers(
    @Query('status') status?: SupplierStatus,
    @Query('isLegacy') isLegacy?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.supplierService.listSuppliers({
      status,
      isLegacy,
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('legacy-status')
  @ApiOperation({ summary: 'Monitor legacy supplier status and deadlines' })
  async getLegacyStatus() {
    return this.supplierService.getLegacyStatus();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get supplier detail with documents and logs' })
  async getSupplierDetail(@Param('id') id: string) {
    return this.supplierService.getSupplierDetail(id);
  }

  @Patch(':id/documents/:docId/review')
  @ApiOperation({ summary: 'Review a supplier document (approve/reject/revision)' })
  async reviewDocument(
    @Param('id') id: string,
    @Param('docId') docId: string,
    @Request() req: any,
    @Body() dto: ReviewDocumentDto,
  ) {
    return this.supplierService.reviewDocument(
      id,
      docId,
      req.user.userId,
      dto.aksi,
      dto.catatan,
    );
  }

  @Patch(':id/verify')
  @ApiOperation({ summary: 'Finalize supplier verification (all docs must be approved)' })
  async finalizeVerification(@Param('id') id: string, @Request() req: any) {
    return this.supplierService.finalizeVerification(id, req.user.userId);
  }

  @Post('legacy-migration')
  @ApiOperation({ summary: 'Migrate existing suppliers to LEGACY_VERIFIED status' })
  async legacyMigration(@Request() req: any, @Body() dto: LegacyMigrationDto) {
    return this.supplierService.legacyMigration(
      req.user.userId,
      dto.supplierIds,
      dto.deadlineDays,
    );
  }
}
