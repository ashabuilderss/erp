import { PropertyType, PropertyStatus } from '@prisma/client';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
export declare class QueryPropertyDto extends BaseQueryDto {
    type?: PropertyType;
    status?: PropertyStatus;
    city?: string;
    locality?: string;
    assignedToEmployeeId?: string;
}
