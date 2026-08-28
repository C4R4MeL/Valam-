import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { TipeDocument } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const BUCKET_NAME = 'supplier-documents';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME: Record<string, string[]> = {
  AKTA_KOPERASI: ['application/pdf'],
  COA: ['application/pdf'],
  SURAT_PERNYATAAN: ['application/pdf'],
  FOTO_FASILITAS: ['image/jpeg', 'image/png', 'image/webp'],
};

@Injectable()
export class SupplierStorageService {
  private readonly logger = new Logger(SupplierStorageService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'supplier-documents');

  constructor(private readonly supabaseService: SupabaseService) {
    // Ensure local upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Validate file MIME type and size, then upload to Supabase Storage.
   * Falls back to local disk storage if Supabase credentials are placeholder or upload fails.
   */
  async uploadDocument(
    supplierId: string,
    tipeDocument: TipeDocument,
    file: Express.Multer.File,
  ): Promise<{ path: string; fileName: string; fileSize: number }> {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `Ukuran file melebihi batas maksimal 5MB. File Anda: ${(file.size / 1024 / 1024).toFixed(1)}MB`,
      );
    }

    // Validate MIME type
    const allowed = ALLOWED_MIME[tipeDocument];
    if (!allowed || !allowed.includes(file.mimetype)) {
      const expectedTypes = tipeDocument === 'FOTO_FASILITAS' ? 'JPG, PNG, atau WEBP' : 'PDF';
      throw new BadRequestException(
        `Format file tidak valid untuk ${tipeDocument}. Harap upload file ${expectedTypes}.`,
      );
    }

    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${supplierId}/${tipeDocument}/${timestamp}-${sanitizedName}`;

    // Check if Supabase credentials are placeholders
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_KEY || '';
    const isPlaceholder = 
      supabaseUrl.includes('your-project') || 
      supabaseKey.includes('your-anon-key') ||
      !supabaseUrl ||
      !supabaseKey;

    if (isPlaceholder) {
      this.logger.warn('[Storage] Credentials are placeholders. Using local filesystem fallback.');
      return this.saveToLocalDisk(storagePath, file);
    }

    try {
      const supabase = this.supabaseService.getClient();
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        throw new Error(error.message);
      }

      this.logger.log(`[Storage] Uploaded successfully to Supabase: ${storagePath}`);
      return {
        path: storagePath,
        fileName: file.originalname,
        fileSize: file.size,
      };
    } catch (err: any) {
      this.logger.warn(`[Storage] Supabase upload failed (${err.message}). Falling back to local disk.`);
      return this.saveToLocalDisk(storagePath, file);
    }
  }

  /**
   * Generate a signed URL for previewing a document (expires in 1 hour).
   * If stored locally, returns a local preview controller route path.
   */
  async getSignedUrl(storagePath: string): Promise<string> {
    const localFilePath = path.join(this.uploadDir, storagePath);
    
    // Check if file exists locally
    if (fs.existsSync(localFilePath)) {
      const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:3001';
      return `${backendUrl}/api/suppliers/documents/preview?path=${encodeURIComponent(storagePath)}`;
    }

    try {
      const supabase = this.supabaseService.getClient();
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(storagePath, 3600); // 1 hour

      if (error) {
        throw new Error(error.message);
      }

      return data.signedUrl;
    } catch (err: any) {
      this.logger.error(`[Storage] Signed URL failed: ${err.message}`);
      // Return local preview path as fallback
      const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:3001';
      return `${backendUrl}/api/suppliers/documents/preview?path=${encodeURIComponent(storagePath)}`;
    }
  }

  /**
   * Delete a file from storage.
   */
  async deleteFile(storagePath: string): Promise<void> {
    const localFilePath = path.join(this.uploadDir, storagePath);
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
        this.logger.log(`[Storage] Deleted local file: ${storagePath}`);
      } catch (err: any) {
        this.logger.error(`[Storage] Failed to delete local file: ${err.message}`);
      }
      return;
    }

    const supabase = this.supabaseService.getClient();
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([storagePath]);

    if (error) {
      this.logger.error(`[Storage] Delete from Supabase failed: ${error.message}`);
    }
  }

  /**
   * Helper to save files locally on disk.
   */
  private saveToLocalDisk(
    storagePath: string,
    file: Express.Multer.File,
  ): { path: string; fileName: string; fileSize: number } {
    const targetPath = path.join(this.uploadDir, storagePath);
    const targetDir = path.dirname(targetPath);

    // Create target subdirectory
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Write file to disk
    fs.writeFileSync(targetPath, file.buffer);
    this.logger.log(`[Storage] Saved locally at: ${targetPath}`);

    return {
      path: storagePath,
      fileName: file.originalname,
      fileSize: file.size,
    };
  }

  /**
   * Streaming download for locally stored files (used by preview route).
   */
  getLocalFileStream(storagePath: string): fs.ReadStream {
    const filePath = path.join(this.uploadDir, storagePath);
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException('File tidak ditemukan.');
    }
    return fs.createReadStream(filePath);
  }

  /**
   * Get mimetype of local file.
   */
  getLocalFileMime(storagePath: string): string {
    const ext = path.extname(storagePath).toLowerCase();
    const map: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    return map[ext] || 'application/octet-stream';
  }
}
