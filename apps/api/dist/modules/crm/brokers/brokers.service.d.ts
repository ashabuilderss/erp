import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../config/prisma.service';
import { CreateBrokerDto } from './dto/create-broker.dto';
import { UpdateBrokerDto } from './dto/update-broker.dto';
import { QueryBrokerDto } from './dto/query-broker.dto';
import { Prisma } from '@prisma/client';
export declare class BrokersService {
    private prisma;
    private eventEmitter;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2);
    create(dto: CreateBrokerDto, companyId: string): Promise<{
        name: string;
        id: string;
        email: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        phone: string | null;
        companyName: string | null;
        commissionRate: Prisma.Decimal | null;
    }>;
    findAll(query: QueryBrokerDto, companyId: string): Promise<{
        data: {
            name: string;
            id: string;
            email: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            phone: string | null;
            companyName: string | null;
            commissionRate: Prisma.Decimal | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string, companyId: string): Promise<{
        leads: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            assignedToEmployeeId: string | null;
            status: import(".prisma/client").$Enums.LeadStatus;
            propertyId: string | null;
            customerName: string;
            customerEmail: string | null;
            customerPhone: string | null;
            source: import(".prisma/client").$Enums.LeadSource;
            notes: string | null;
            brokerId: string | null;
            convertedToCustomerId: string | null;
            lostReason: string | null;
        }[];
    } & {
        name: string;
        id: string;
        email: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        phone: string | null;
        companyName: string | null;
        commissionRate: Prisma.Decimal | null;
    }>;
    update(id: string, dto: UpdateBrokerDto, companyId: string): Promise<{
        name: string;
        id: string;
        email: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        phone: string | null;
        companyName: string | null;
        commissionRate: Prisma.Decimal | null;
    }>;
    remove(id: string, companyId: string): Promise<{
        success: boolean;
    }>;
}
