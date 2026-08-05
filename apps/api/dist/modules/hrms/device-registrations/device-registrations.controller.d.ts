import { DeviceRegistrationsService } from './device-registrations.service';
import { CreateDeviceRegistrationDto } from './dto/create-device-registration.dto';
import { QueryDeviceRegistrationDto } from './dto/query-device-registration.dto';
export declare class DeviceRegistrationsController {
    private readonly service;
    constructor(service: DeviceRegistrationsService);
    create(dto: CreateDeviceRegistrationDto, employeeId: string | null, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        employeeId: string;
        deviceId: string;
        deviceName: string;
        isTrusted: boolean;
        fcmtoken: string | null;
    }>;
    findAll(query: QueryDeviceRegistrationDto, companyId: string): Promise<{
        data: ({
            employees: {
                users: {
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
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            employeeId: string;
            deviceId: string;
            deviceName: string;
            isTrusted: boolean;
            fcmtoken: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findMyDevices(employeeId: string | null): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        employeeId: string;
        deviceId: string;
        deviceName: string;
        isTrusted: boolean;
        fcmtoken: string | null;
    }[]>;
    findOne(id: string, companyId: string): Promise<{
        employees: {
            users: {
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
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        employeeId: string;
        deviceId: string;
        deviceName: string;
        isTrusted: boolean;
        fcmtoken: string | null;
    }>;
    update(id: string, dto: Partial<CreateDeviceRegistrationDto>, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        employeeId: string;
        deviceId: string;
        deviceName: string;
        isTrusted: boolean;
        fcmtoken: string | null;
    }>;
    remove(id: string, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        employeeId: string;
        deviceId: string;
        deviceName: string;
        isTrusted: boolean;
        fcmtoken: string | null;
    }>;
}
