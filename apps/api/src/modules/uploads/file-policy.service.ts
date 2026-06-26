import { BadRequestException, Injectable } from '@nestjs/common';
import { extname } from 'path';

export const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
  'pdf',
  'docx',
  'mp3',
  'webm',
  'dwg',
]);

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'audio/mpeg',
  'audio/mp3',
  'video/webm',
  'audio/webm',
  'application/acad',
  'application/x-acad',
  'application/autocad_dwg',
  'application/dwg',
  'application/x-dwg',
  'image/vnd.dwg',
  'drawing/dwg',
]);

export interface FilePolicyInput {
  originalname: string;
  mimetype: string;
  size: number;
}

export interface FilePolicyResult {
  extension: string;
  maxSizeBytes: number;
  allowed: true;
}

@Injectable()
export class FilePolicyService {
  validate(file: FilePolicyInput, imageOnly = false): FilePolicyResult {
    const extension = extname(file.originalname).replace('.', '').toLowerCase();

    if (!extension || !ALLOWED_EXTENSIONS.has(extension)) {
      throw new BadRequestException(
        'Unsupported file type. Allowed: JPG, PNG, WEBP, PDF, DOCX, MP3, WEBM, DWG',
      );
    }

    if (imageOnly && !['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
      throw new BadRequestException(
        'Only JPG, PNG, and WebP images are allowed',
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Unsupported file MIME type');
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      throw new BadRequestException('File exceeds the 25MB upload limit');
    }

    return { extension, maxSizeBytes: MAX_UPLOAD_SIZE_BYTES, allowed: true };
  }

  getPolicy() {
    return {
      maxSizeBytes: MAX_UPLOAD_SIZE_BYTES,
      allowedExtensions: Array.from(ALLOWED_EXTENSIONS).sort(),
      allowedMimeTypes: Array.from(ALLOWED_MIME_TYPES).sort(),
    };
  }
}
