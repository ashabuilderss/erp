import { PunchType } from '@prisma/client';
export declare class CheckInDto {
    latitude?: number;
    longitude?: number;
    checkInPhoto?: string;
    nonce: string;
}
export declare class CheckOutDto {
    latitude?: number;
    longitude?: number;
    checkOutPhoto?: string;
    nonce: string;
}
export declare class PunchDto {
    punchType: PunchType;
    latitude?: number;
    longitude?: number;
    photoUrl?: string;
    nonce: string;
    deviceId?: string;
    locationId?: string;
    gpsAccuracy?: number;
    mockLocationDetected?: boolean;
    developerModeActive?: boolean;
}
