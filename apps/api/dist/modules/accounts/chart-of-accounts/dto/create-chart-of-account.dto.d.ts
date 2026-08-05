import { AccountType } from '@prisma/client';
export declare class CreateChartOfAccountDto {
    code: string;
    name: string;
    type: AccountType;
    parentId?: string;
    description?: string;
    isActive?: boolean;
}
