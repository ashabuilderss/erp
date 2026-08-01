import { Global, Module } from '@nestjs/common';
import { TransitionService } from './transition.service';
import { AdvisoryLockService } from './advisory-lock.service';
import { HealthService } from './health.service';
import { SoftDeleteService } from './soft-delete.service';
import { IdempotencyService } from './idempotency.service';

@Global()
@Module({
  providers: [
    TransitionService,
    AdvisoryLockService,
    HealthService,
    SoftDeleteService,
    IdempotencyService,
  ],
  exports: [
    TransitionService,
    AdvisoryLockService,
    HealthService,
    SoftDeleteService,
    IdempotencyService,
  ],
})
export class CommonServicesModule {}
