import { Module } from '@nestjs/common';
import { PaymentSchedulesController } from './payment-schedules.controller';
import { PaymentSchedulesService } from './payment-schedules.service';
import { PaymentEntriesController } from './payment-entries.controller';
import { PaymentEntriesService } from './payment-entries.service';
import { ExpenseClaimsController } from './expense-claims.controller';
import { ExpenseClaimsService } from './expense-claims.service';

@Module({
  controllers: [
    PaymentSchedulesController,
    PaymentEntriesController,
    ExpenseClaimsController,
  ],
  providers: [
    PaymentSchedulesService,
    PaymentEntriesService,
    ExpenseClaimsService,
  ],
})
export class AccountsModule {}
