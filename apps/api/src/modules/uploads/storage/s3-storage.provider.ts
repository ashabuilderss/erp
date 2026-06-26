import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { extname } from 'path';
import { randomBytes } from 'crypto';
import { StorageProvider, UploadResult } from './storage-provider.interface';

@Injectable()
export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor() {
    const region = process.env.S3_REGION || 'us-east-1';
    const endpoint = process.env.S3_ENDPOINT;
    this.bucket = process.env.S3_BUCKET || 'asha-builders-uploads';
    this.publicUrl =
      process.env.S3_PUBLIC_URL ||
      `https://${this.bucket}.s3.${region}.amazonaws.com`;

    this.client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      forcePathStyle: endpoint ? true : false,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
    });
  }

  async upload(file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  }): Promise<UploadResult> {
    const key = `${Date.now()}-${randomBytes(6).toString('hex')}${extname(file.originalname)}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    return {
      url: `${this.publicUrl}/${key}`,
      key,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  getUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }
}
