import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { EncryptionService } from '../../common/services/encryption.service';

@Module({
  controllers: [CompaniesController],
  providers: [CompaniesService, EncryptionService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
