import { Module } from '@nestjs/common';
import { PaymentSchedulesController } from './payment-schedules.controller';
import { PaymentSchedulesService } from './payment-schedules.service';
import { PaymentEntriesController } from './payment-entries.controller';
import { PaymentEntriesService } from './payment-entries.service';
import { ExpenseClaimsController } from './expense-claims.controller';
import { ExpenseClaimsService } from './expense-claims.service';
import { ChartOfAccountsController } from './chart-of-accounts/chart-of-accounts.controller';
import { ChartOfAccountsService } from './chart-of-accounts/chart-of-accounts.service';

@Module({
  controllers: [
    PaymentSchedulesController,
    PaymentEntriesController,
    ExpenseClaimsController,
    ChartOfAccountsController,
  ],
  providers: [
    PaymentSchedulesService,
    PaymentEntriesService,
    ExpenseClaimsService,
    ChartOfAccountsService,
  ],
  exports: [ChartOfAccountsService],
})
export class AccountsModule {}
