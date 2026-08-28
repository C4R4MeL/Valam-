import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SupplierService } from './supplier.service';
import { SupplierStorageService } from './supplier-storage.service';
import { RegisterSupplierDto } from './dto/register-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';

@ApiTags('Supplier')
@ApiBearerAuth()
@Controller('suppliers')
export class SupplierController {
  constructor(
    private readonly supplierService: SupplierService,
    private readonly storageService: SupplierStorageService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get list of verified suppliers publicly' })
  async getPublicSuppliers(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit) : 4;
    return this.supplierService.getPublicSuppliers(status, limitNum);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('supplier')
  @ApiOperation({ summary: 'Register supplier profile (Poin 1 data)' })
  async register(@Request() req: any, @Body() dto: RegisterSupplierDto) {
    return this.supplierService.register(req.user.userId, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('supplier')
  @ApiOperation({ summary: 'Get current supplier profile with documents' })
  async getMyProfile(@Request() req: any) {
    return this.supplierService.getMyProfile(req.user.userId);
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('supplier')
  @ApiOperation({ summary: 'Update supplier profile data' })
  async updateProfile(@Request() req: any, @Body() dto: UpdateSupplierDto) {
    return this.supplierService.updateProfile(req.user.userId, dto);
  }

  @Post('me/documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('supplier')
  @ApiOperation({ summary: 'Upload a verification document' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Request() req: any,
    @Body() dto: UploadDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      return { message: 'File wajib diupload.' };
    }
    return this.supplierService.uploadDocument(
      req.user.userId,
      dto.tipeDocument,
      dto.tanggalCoa,
      file,
    );
  }

  @Delete('me/documents/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('supplier')
  @ApiOperation({ summary: 'Delete a document (only PENDING/REVISION_REQUESTED)' })
  async deleteDocument(@Request() req: any, @Param('id') id: string) {
    return this.supplierService.deleteDocument(req.user.userId, id);
  }

  @Post('me/submit-verification')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('supplier')
  @ApiOperation({ summary: 'Submit all documents for admin verification' })
  async submitVerification(@Request() req: any) {
    return this.supplierService.submitVerification(req.user.userId);
  }

  @Get('documents/preview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('supplier', 'admin')
  @ApiOperation({ summary: 'Preview a locally uploaded document (Supplier/Admin)' })
  async previewDocument(@Query('path') storagePath: string, @Res() res: any) {
    // Basic path sanitization to prevent directory traversal
    const cleanPath = storagePath.replace(/\.\./g, '');
    const mimeType = this.storageService.getLocalFileMime(cleanPath);
    const fileStream = this.storageService.getLocalFileStream(cleanPath);
    
    res.setHeader('Content-Type', mimeType);
    fileStream.pipe(res);
  }
}
