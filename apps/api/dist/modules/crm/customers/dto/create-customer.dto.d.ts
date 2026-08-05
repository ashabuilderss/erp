import { CustomerType } from '@prisma/client';
export declare class CreateCustomerDto {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    type?: CustomerType;
    source?: string;
    notes?: string;
}
