import { Module } from '@nestjs/common';
import { RecruitmentController } from './recruitment.controller';
import { RecruitmentService } from './recruitment.service';
import { PrismaService } from '../../config/prisma.service';

@Module({
  controllers: [RecruitmentController],
  providers: [RecruitmentService, PrismaService],
})
export class RecruitmentModule {}
