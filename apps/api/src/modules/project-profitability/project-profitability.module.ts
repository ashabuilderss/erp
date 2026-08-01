import { Module } from '@nestjs/common';
import { ProjectProfitabilityController } from './project-profitability.controller';
import { ProjectProfitabilityService } from './project-profitability.service';
import { PrismaService } from '../../config/prisma.service';

@Module({
  controllers: [ProjectProfitabilityController],
  providers: [ProjectProfitabilityService, PrismaService],
})
export class ProjectProfitabilityModule {}
