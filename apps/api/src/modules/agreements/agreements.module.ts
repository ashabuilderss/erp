import { Module } from '@nestjs/common';
import { AgreementsController } from './agreements.controller';
import { AgreementsService } from './agreements.service';
import { PrismaService } from '../../config/prisma.service';

@Module({
  controllers: [AgreementsController],
  providers: [AgreementsService, PrismaService],
})
export class AgreementsModule {}
