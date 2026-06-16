import { PartialType } from '@nestjs/mapped-types';
import { CreateLeaveAllocationDto } from './create-leave-allocation.dto';

export class UpdateLeaveAllocationDto extends PartialType(
  CreateLeaveAllocationDto,
) {}
