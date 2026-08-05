import { PrismaService } from '../../config/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateSopDto, UpdateSopDto, QuerySopDto } from './dto/create-sop.dto';
import { CreateTrainingRecordDto, QueryTrainingRecordDto } from './dto/create-training-record.dto';
export declare class TrainingService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAllSops(companyId: string, query: QuerySopDto): Promise<{
        items: ({
            department: {
                name: string;
                id: string;
            } | null;
            _count: {
                acknowledgements: number;
            };
        } & {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            departmentId: string | null;
            title: string;
            content: string | null;
            fileUrl: string | null;
            version: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    createSop(companyId: string, dto: CreateSopDto): Promise<{
        department: {
            name: string;
            id: string;
        } | null;
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        departmentId: string | null;
        title: string;
        content: string | null;
        fileUrl: string | null;
        version: string;
    }>;
    findOneSop(companyId: string, id: string): Promise<{
        department: {
            name: string;
            id: string;
        } | null;
        _count: {
            acknowledgements: number;
        };
        acknowledgements: ({
            employee: {
                users: {
                    email: string;
                    firstName: string;
                    lastName: string;
                } | null;
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                companyId: string;
                deletedAt: Date | null;
                userId: string | null;
                teamId: string | null;
                departmentId: string;
                status: import(".prisma/client").$Enums.EmployeeStatus;
                employeeCode: string;
                designationId: string;
                phone: string | null;
                dateOfJoining: Date | null;
                salary: Prisma.Decimal | null;
                address: string | null;
                managerId: string | null;
                staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
            };
        } & {
            id: string;
            companyId: string;
            employeeId: string;
            acknowledgedAt: Date;
            sopDocumentId: string;
        })[];
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        departmentId: string | null;
        title: string;
        content: string | null;
        fileUrl: string | null;
        version: string;
    }>;
    updateSop(companyId: string, id: string, dto: UpdateSopDto): Promise<{
        department: {
            name: string;
            id: string;
        } | null;
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        departmentId: string | null;
        title: string;
        content: string | null;
        fileUrl: string | null;
        version: string;
    }>;
    removeSop(companyId: string, id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        departmentId: string | null;
        title: string;
        content: string | null;
        fileUrl: string | null;
        version: string;
    }>;
    acknowledgeSop(companyId: string, sopId: string, employeeId: string): Promise<{
        employee: {
            users: {
                email: string;
                firstName: string;
                lastName: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            userId: string | null;
            teamId: string | null;
            departmentId: string;
            status: import(".prisma/client").$Enums.EmployeeStatus;
            employeeCode: string;
            designationId: string;
            phone: string | null;
            dateOfJoining: Date | null;
            salary: Prisma.Decimal | null;
            address: string | null;
            managerId: string | null;
            staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
        };
    } & {
        id: string;
        companyId: string;
        employeeId: string;
        acknowledgedAt: Date;
        sopDocumentId: string;
    }>;
    listAcknowledgements(companyId: string, sopId: string): Promise<({
        employee: {
            users: {
                email: string;
                firstName: string;
                lastName: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            userId: string | null;
            teamId: string | null;
            departmentId: string;
            status: import(".prisma/client").$Enums.EmployeeStatus;
            employeeCode: string;
            designationId: string;
            phone: string | null;
            dateOfJoining: Date | null;
            salary: Prisma.Decimal | null;
            address: string | null;
            managerId: string | null;
            staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
        };
    } & {
        id: string;
        companyId: string;
        employeeId: string;
        acknowledgedAt: Date;
        sopDocumentId: string;
    })[]>;
    findAllRecords(companyId: string, query: QueryTrainingRecordDto): Promise<{
        items: ({
            employee: {
                users: {
                    email: string;
                    firstName: string;
                    lastName: string;
                } | null;
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                companyId: string;
                deletedAt: Date | null;
                userId: string | null;
                teamId: string | null;
                departmentId: string;
                status: import(".prisma/client").$Enums.EmployeeStatus;
                employeeCode: string;
                designationId: string;
                phone: string | null;
                dateOfJoining: Date | null;
                salary: Prisma.Decimal | null;
                address: string | null;
                managerId: string | null;
                staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
            };
            sopDocument: {
                id: string;
                title: string;
                version: string;
            };
        } & {
            id: string;
            companyId: string;
            employeeId: string;
            completedAt: Date;
            score: number | null;
            sopDocumentId: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    createRecord(companyId: string, dto: CreateTrainingRecordDto): Promise<{
        employee: {
            users: {
                email: string;
                firstName: string;
                lastName: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            userId: string | null;
            teamId: string | null;
            departmentId: string;
            status: import(".prisma/client").$Enums.EmployeeStatus;
            employeeCode: string;
            designationId: string;
            phone: string | null;
            dateOfJoining: Date | null;
            salary: Prisma.Decimal | null;
            address: string | null;
            managerId: string | null;
            staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
        };
        sopDocument: {
            id: string;
            title: string;
            version: string;
        };
    } & {
        id: string;
        companyId: string;
        employeeId: string;
        completedAt: Date;
        score: number | null;
        sopDocumentId: string;
    }>;
}
