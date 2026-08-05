import { CommissionStatus } from '@prisma/client';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
export declare class QueryCommissionDto extends BaseQueryDto {
    status?: CommissionStatus;
    employeeId?: string;
}
