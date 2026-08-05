import { Prisma } from '@prisma/client';
interface RecordHistoryInput {
    tx: Prisma.TransactionClient;
    companyId: string;
    targetType: string;
    targetId: string;
    actorId?: string;
    transitionType: string;
    previousState?: string;
    newState?: string;
    reason?: string;
}
export declare class AttendanceHistoryService {
    record(input: RecordHistoryInput): Promise<void>;
}
export {};
