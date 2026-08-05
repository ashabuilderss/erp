import { LeadSource, LeadStatus } from '@prisma/client';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
export declare class QueryLeadDto extends BaseQueryDto {
    propertyId?: string;
    source?: LeadSource;
    status?: LeadStatus;
    assignedToEmployeeId?: string;
}
