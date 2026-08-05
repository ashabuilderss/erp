import { InventoryTransactionType } from '@prisma/client';
export declare class RecordTransactionDto {
    type: InventoryTransactionType;
    quantity: number;
    siteFromId?: string;
    siteToId?: string;
}
export declare class RecordInwardDto {
    quantity: number;
}
export declare class RecordOutwardDto {
    quantity: number;
}
export declare class RecordWastageDto {
    quantity: number;
}
export declare class RecordTransferDto {
    quantity: number;
    siteFromId: string;
    siteToId: string;
}
