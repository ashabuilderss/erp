import { IncentiveStatus, PayoutStatus } from '@prisma/client';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
export declare class QueryIncentiveDto extends BaseQueryDto {
    status?: IncentiveStatus;
    payoutStatus?: PayoutStatus;
}
