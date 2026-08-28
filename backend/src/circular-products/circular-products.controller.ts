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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CircularProductsService } from './circular-products.service';

// Ensure upload directory exists
const uploadDir = './uploads/circular';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@Controller('circular-products')
export class CircularProductsController {
  constructor(private readonly service: CircularProductsService) {}

  // 1. Get approved circular products (Marketplace Catalog)
  @Get()
  async getCatalog(
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAllApproved(category, search);
  }

  // 2. Get supplier's own circular products
  @Get('supplier')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('supplier')
  async getSupplierProducts(@Request() req: any) {
    return this.service.findBySupplier(req.user.userId);
  }

  // 3. Get supplier metrics
  @Get('supplier/metrics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('supplier')
  async getSupplierMetrics(@Request() req: any) {
    return this.service.getSupplierMetrics(req.user.userId);
  }

  // 4. Get admin's circular products list
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getAdminProducts() {
    return this.service.findAllAdmin();
  }

  // 5. Get detail of a specific product
  @Get(':id')
  async getDetails(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // 6. Create a circular product (DRAFT)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('supplier')
  async createProduct(@Request() req: any, @Body() body: any) {
    return this.service.create(req.user.userId, body);
  }

  // 7. Update a circular product
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('supplier')
  async updateProduct(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.service.update(req.user.userId, id, body);
  }

  // 8. Delete a circular product
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('supplier')
  async deleteProduct(@Request() req: any, @Param('id') id: string) {
    return this.service.delete(req.user.userId, id);
  }

  // 9. Submit a circular product for verification
  @Post(':id/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('supplier')
  async submitProduct(@Request() req: any, @Param('id') id: string) {
    return this.service.submitForVerification(req.user.userId, id);
  }

  // 10. Admin review circular product (approve/reject)
  @Post(':id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async reviewProduct(
    @Param('id') id: string,
    @Body() body: { action: 'approve' | 'reject'; rejectionReason?: string },
  ) {
    return this.service.reviewProduct(id, body.action, body.rejectionReason);
  }

  // 11. Admin edit product category
  @Patch(':id/admin-category')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async editCategory(@Param('id') id: string, @Body('category') category: string) {
    return this.service.updateCategoryByAdmin(id, category);
  }

  // 12. Upload image file for circular product
  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('supplier')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/circular',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    // Return relative URL for static loading
    return {
      imageUrl: `/uploads/circular/${file.filename}`,
    };
  }
}
