import { ComplaintStatus } from '@prisma/client';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
export declare class CreateComplaintDto {
    customerId: string;
    propertyId?: string;
    subject: string;
    description: string;
}
export declare class QueryComplaintDto extends BaseQueryDto {
    status?: ComplaintStatus;
    customerId?: string;
}
export declare class UpdateComplaintDto {
    subject?: string;
    description?: string;
    status?: ComplaintStatus;
    resolution?: string;
}
export declare class ResolveComplaintDto {
    resolution: string;
}
