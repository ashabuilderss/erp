import { AssetsService } from './assets.service';
import { CreateAssetDto, UpdateAssetDto, QueryAssetDto } from './dto/create-asset.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { CreateRepairDto, UpdateRepairDto } from './dto/create-repair.dto';
export declare class AssetsController {
    private readonly service;
    constructor(service: AssetsService);
    getSummary(companyId: string): Promise<{
        summary: Record<string, number>;
        total: number;
    }>;
    findAll(companyId: string, query: QueryAssetDto): Promise<{
        items: ({
            _count: {
                assignments: number;
                repairs: number;
            };
            currentAssignee: ({
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
                salary: import("@prisma/client-runtime-utils").Decimal | null;
                address: string | null;
                managerId: string | null;
                staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
            }) | null;
        } & {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            status: import(".prisma/client").$Enums.AssetStatus;
            category: string;
            serialNumber: string | null;
            qrCode: string | null;
            purchaseDate: Date | null;
            purchaseCost: number | null;
            currentAssigneeId: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    create(companyId: string, dto: CreateAssetDto): Promise<{
        currentAssignee: ({
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
            salary: import("@prisma/client-runtime-utils").Decimal | null;
            address: string | null;
            managerId: string | null;
            staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
        }) | null;
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.AssetStatus;
        category: string;
        serialNumber: string | null;
        qrCode: string | null;
        purchaseDate: Date | null;
        purchaseCost: number | null;
        currentAssigneeId: string | null;
    }>;
    findOne(companyId: string, id: string): Promise<{
        assignments: ({
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
                salary: import("@prisma/client-runtime-utils").Decimal | null;
                address: string | null;
                managerId: string | null;
                staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
            };
        } & {
            id: string;
            companyId: string;
            employeeId: string;
            assignedAt: Date;
            returnedAt: Date | null;
            condition: string | null;
            assetId: string;
        })[];
        currentAssignee: ({
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
            salary: import("@prisma/client-runtime-utils").Decimal | null;
            address: string | null;
            managerId: string | null;
            staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
        }) | null;
        repairs: {
            id: string;
            companyId: string;
            description: string;
            status: string;
            startDate: Date;
            endDate: Date | null;
            assetId: string;
            cost: number | null;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.AssetStatus;
        category: string;
        serialNumber: string | null;
        qrCode: string | null;
        purchaseDate: Date | null;
        purchaseCost: number | null;
        currentAssigneeId: string | null;
    }>;
    update(companyId: string, id: string, dto: UpdateAssetDto): Promise<{
        currentAssignee: ({
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
            salary: import("@prisma/client-runtime-utils").Decimal | null;
            address: string | null;
            managerId: string | null;
            staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
        }) | null;
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.AssetStatus;
        category: string;
        serialNumber: string | null;
        qrCode: string | null;
        purchaseDate: Date | null;
        purchaseCost: number | null;
        currentAssigneeId: string | null;
    }>;
    remove(companyId: string, id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.AssetStatus;
        category: string;
        serialNumber: string | null;
        qrCode: string | null;
        purchaseDate: Date | null;
        purchaseCost: number | null;
        currentAssigneeId: string | null;
    }>;
    assign(companyId: string, id: string, dto: CreateAssignmentDto): Promise<{
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
            salary: import("@prisma/client-runtime-utils").Decimal | null;
            address: string | null;
            managerId: string | null;
            staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
        };
    } & {
        id: string;
        companyId: string;
        employeeId: string;
        assignedAt: Date;
        returnedAt: Date | null;
        condition: string | null;
        assetId: string;
    }>;
    returnAsset(companyId: string, id: string): Promise<({
        currentAssignee: ({
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
            salary: import("@prisma/client-runtime-utils").Decimal | null;
            address: string | null;
            managerId: string | null;
            staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
        }) | null;
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.AssetStatus;
        category: string;
        serialNumber: string | null;
        qrCode: string | null;
        purchaseDate: Date | null;
        purchaseCost: number | null;
        currentAssigneeId: string | null;
    }) | null>;
    listAssignments(companyId: string, id: string): Promise<({
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
            salary: import("@prisma/client-runtime-utils").Decimal | null;
            address: string | null;
            managerId: string | null;
            staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
        };
    } & {
        id: string;
        companyId: string;
        employeeId: string;
        assignedAt: Date;
        returnedAt: Date | null;
        condition: string | null;
        assetId: string;
    })[]>;
    createRepair(companyId: string, id: string, dto: CreateRepairDto): Promise<{
        id: string;
        companyId: string;
        description: string;
        status: string;
        startDate: Date;
        endDate: Date | null;
        assetId: string;
        cost: number | null;
    }>;
    updateRepair(companyId: string, repairId: string, dto: UpdateRepairDto): Promise<{
        id: string;
        companyId: string;
        description: string;
        status: string;
        startDate: Date;
        endDate: Date | null;
        assetId: string;
        cost: number | null;
    }>;
}
