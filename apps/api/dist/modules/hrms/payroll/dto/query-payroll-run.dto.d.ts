import { PayrollRunStatus } from '@prisma/client';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
export declare class QueryPayrollRunDto extends BaseQueryDto {
    status?: PayrollRunStatus;
}
