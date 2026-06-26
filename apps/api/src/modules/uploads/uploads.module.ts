import { Module } from '@nestjs/common';
import { FilePolicyService } from './file-policy.service';
import { UploadsController } from './uploads.controller';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [UploadsController],
  providers: [FilePolicyService],
  exports: [FilePolicyService],
})
export class UploadsModule {}
