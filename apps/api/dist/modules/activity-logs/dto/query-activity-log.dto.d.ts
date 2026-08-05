import { BaseQueryDto } from '../../../common/dto/base-query.dto';
export declare class QueryActivityLogDto extends BaseQueryDto {
    action?: string;
    entityType?: string;
    performedById?: string;
    format?: 'csv' | 'json';
}
