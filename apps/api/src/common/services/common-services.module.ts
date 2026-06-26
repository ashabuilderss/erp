import { Global, Module } from '@nestjs/common';
import { TransitionService } from './transition.service';
import { AdvisoryLockService } from './advisory-lock.service';
import { HealthService } from './health.service';

@Global()
@Module({
  providers: [TransitionService, AdvisoryLockService, HealthService],
  exports: [TransitionService, AdvisoryLockService, HealthService],
})
export class CommonServicesModule {}
