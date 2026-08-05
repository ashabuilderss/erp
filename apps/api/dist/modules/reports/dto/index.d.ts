import { BaseQueryDto } from '../../../common/dto/base-query.dto';
export declare class CreateReportExportDto {
    reportKey: string;
    format: string;
    dateFrom?: string;
    dateTo?: string;
    filters?: Record<string, any>;
}
export declare class QueryReportExportDto extends BaseQueryDto {
}
export declare class QueryAnalyticsDto {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    employeeId?: string;
    period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}
