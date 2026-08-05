import { RedisService } from '../../config/redis.service';
export interface IdempotencyResult {
    isReplay: boolean;
    responseBody?: unknown;
    statusCode?: number;
    generatedKey?: string;
}
export declare class IdempotencyService {
    private readonly redis;
    private readonly logger;
    constructor(redis: RedisService);
    generateKey(): string;
    private buildRedisKey;
    check(idempotencyKey: string, companyId: string): Promise<{
        status: 'new';
    } | {
        status: 'in_progress';
    } | {
        status: 'completed';
        body: unknown;
        statusCode: number;
    } | {
        status: 'error';
        body: unknown;
        statusCode: number;
    }>;
    markInProgress(idempotencyKey: string, companyId: string): Promise<void>;
    markCompleted(idempotencyKey: string, companyId: string, body: unknown, statusCode: number): Promise<void>;
    markError(idempotencyKey: string, companyId: string, body: unknown, statusCode: number): Promise<void>;
}
