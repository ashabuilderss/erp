import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { LeadFollowUpService } from './lead-followup.service';
import { LeadFollowUpController } from './lead-followup.controller';

@Module({
  controllers: [LeadsController, LeadFollowUpController],
  providers: [LeadsService, LeadFollowUpService],
  exports: [LeadsService, LeadFollowUpService],
})
export class LeadsModule {}
