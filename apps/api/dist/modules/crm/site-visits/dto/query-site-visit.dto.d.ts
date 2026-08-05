import { SiteVisitStatus } from '@prisma/client';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
export declare class QuerySiteVisitDto extends BaseQueryDto {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    propertyId?: string;
    customerId?: string;
    leadId?: string;
    status?: SiteVisitStatus;
    scheduledDateFrom?: string;
    scheduledDateTo?: string;
    assignedToEmployeeId?: string;
}
