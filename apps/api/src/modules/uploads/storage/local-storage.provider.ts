import { Injectable } from '@nestjs/common';
import { extname, isAbsolute, join, relative, resolve } from 'path';
import * as fs from 'fs';
import { randomBytes } from 'crypto';
import { StorageProvider, UploadResult } from './storage-provider.interface';

const UPLOADS_DIR = join(process.cwd(), 'uploads');

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  async upload(file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  }): Promise<UploadResult> {
    const dir = join(UPLOADS_DIR, 'general');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const key = `${Date.now()}-${randomBytes(6).toString('hex')}${extname(file.originalname)}`;
    const filePath = join(dir, key);
    fs.writeFileSync(filePath, file.buffer);
    const signedUrl = await this.getUrl(`general/${key}`);
    return {
      url: signedUrl,
      key: `general/${key}`,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  async delete(key: string): Promise<void> {
    const uploadsRoot = resolve(UPLOADS_DIR);
    const filePath = resolve(uploadsRoot, key);
    const relativePath = relative(uploadsRoot, filePath);
    if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
      return;
    }
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  async getUrl(key: string): Promise<string> {
    return `/uploads/${key}`;
  }
}
