import { CustomerType } from '@prisma/client';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
export declare class QueryCustomerDto extends BaseQueryDto {
    type?: CustomerType;
    createdById?: string;
}
