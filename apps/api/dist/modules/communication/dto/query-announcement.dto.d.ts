import { AnnouncementStatus } from '@prisma/client';
export declare class QueryAnnouncementDto {
    page?: number;
    limit?: number;
    status?: AnnouncementStatus;
}
