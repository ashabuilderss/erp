import { RealtimeGateway } from '../../common/realtime/realtime.gateway';
interface ChangeEvent {
    companyId: string;
    entityId?: string;
    action: string;
}
export declare class EventsService {
    private readonly realtimeGateway;
    private readonly logger;
    constructor(realtimeGateway: RealtimeGateway);
    push(companyId: string, event: string, entityType: string, payload?: unknown): void;
    handleCreate(payload: ChangeEvent): void;
    handleUpdate(payload: ChangeEvent): void;
    handleDelete(payload: ChangeEvent): void;
}
export {};
