import { UserRole } from '@prisma/client';
export declare class UpdateUserDto {
    role?: UserRole;
    isActive?: boolean;
}
