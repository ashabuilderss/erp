import {
  Controller,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  FilePolicyService,
  MAX_UPLOAD_SIZE_BYTES,
} from './file-policy.service';
import { StorageProvider } from './storage/storage-provider.interface';

@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly filePolicyService: FilePolicyService,
    @Inject('STORAGE_PROVIDER') private readonly storage: StorageProvider,
  ) {}

  @Post('avatar')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (_req, file, callback) => {
        if (
          !['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)
        ) {
          return callback(
            new BadRequestException(
              'Only JPG, PNG, and WebP images are allowed',
            ),
            false,
          );
        }
        callback(null, true);
      },
      limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
    }),
  )
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    this.filePolicyService.validate(file, true);
    const result = await this.storage.upload({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });
    return result;
  }

  @Post('property-images')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      fileFilter: (_req, file, callback) => {
        if (
          !['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)
        ) {
          return callback(
            new BadRequestException(
              'Only JPG, PNG, and WebP images are allowed',
            ),
            false,
          );
        }
        callback(null, true);
      },
      limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
    }),
  )
  async uploadPropertyImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files?.length)
      throw new BadRequestException('At least one file is required');
    return Promise.all(
      files.map(async (f) => {
        this.filePolicyService.validate(f, true);
        return this.storage.upload({
          buffer: f.buffer,
          originalname: f.originalname,
          mimetype: f.mimetype,
          size: f.size,
        });
      }),
    );
  }

  @Post('general')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
    }),
  )
  async uploadGeneral(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    this.filePolicyService.validate(file);
    const result = await this.storage.upload({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });
    return result;
  }

  @Delete(':key')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async deleteFile(@Param('key') key: string) {
    await this.storage.delete(key);
    return { success: true };
  }
}
