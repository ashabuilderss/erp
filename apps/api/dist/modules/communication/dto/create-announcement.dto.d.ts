export declare class CreateAnnouncementDto {
    title: string;
    body: string;
    priority?: string;
    targetRoles: string[];
    targetEmployees: string[];
    expiresAt?: string;
}
export declare class PublishAnnouncementDto {
    announcementId: string;
}
export declare class ArchiveAnnouncementDto {
    announcementId: string;
}
