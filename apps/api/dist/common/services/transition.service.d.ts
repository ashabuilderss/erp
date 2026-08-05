import { PrismaService } from '../../config/prisma.service';
interface TransitionOperation<T = any> {
    entityType: string;
    id: string;
    newStatus: string;
    companyId: string;
    currentUserRole?: string;
    currentEmployeeId?: string;
    before?: (tx: any, entity: any) => Promise<void>;
    after?: (result: T) => Promise<void>;
    include?: any;
}
export declare class TransitionService {
    private prisma;
    private rules;
    constructor(prisma: PrismaService);
    private getRule;
    canTransition(entityType: string, currentStatus: string, newStatus: string): boolean;
    validate(entityType: string, currentStatus: string, newStatus: string): void;
    execute<T = any>(op: TransitionOperation<T>): Promise<T>;
}
export {};
