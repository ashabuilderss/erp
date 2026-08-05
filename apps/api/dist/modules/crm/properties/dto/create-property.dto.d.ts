import { PropertyType, PropertyStatus } from '@prisma/client';
export declare class CreatePropertyDto {
    propertyCode?: string;
    title: string;
    description?: string;
    type?: PropertyType;
    status?: PropertyStatus;
    price: number;
    area?: number;
    bedrooms?: number;
    bathrooms?: number;
    location: string;
    locality?: string;
    city: string;
    state: string;
    images?: string[];
    amenities?: string[];
    assignedToEmployeeId?: string;
}
