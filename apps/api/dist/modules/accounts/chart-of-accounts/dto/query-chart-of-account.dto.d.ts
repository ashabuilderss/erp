import { AccountType } from '@prisma/client';
export declare class QueryChartOfAccountDto {
    page?: string;
    limit?: string;
    type?: AccountType;
    search?: string;
}
