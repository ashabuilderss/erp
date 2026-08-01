import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const SOFT_DELETE_MODELS = [
  'Task', 'Warning', 'PayrollHold', 'PayrollRun', 'Payslip', 
  'LeaveRequest', 'EodReport', 'ExpenseClaim', 'Incentive', 
  'ConstructionSite', 'SitePhase', 'SiteVisit', 'InventoryItem', 
  'MaterialInward', 'PaymentEntry', 'PaymentSchedule', 
  'Notification', 'Complaint', 'Announcement', 'Booking', 
  'LabourEntry', 'ProgressPhoto', 'Vendor', 'PerformanceScore', 
  'ManagerRating', 'Broker'
];

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    super({ adapter });

    // Soft delete middleware disabled — $use is not compatible with
    // Prisma driver adapters (@prisma/adapter-pg). Soft deletes are
    // handled at the service/repository level instead.
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
