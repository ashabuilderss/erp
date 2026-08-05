import { DomainEvent } from '@prisma/client';
import { RealtimeGateway } from '../../common/realtime/realtime.gateway';
export declare class DashboardMetricsListener {
    private readonly realtimeGateway;
    private readonly logger;
    constructor(realtimeGateway: RealtimeGateway);
    onAnyDomainEvent(event: DomainEvent): Promise<void>;
    onAttendancePunchRecorded(_event: DomainEvent): Promise<void>;
    onAttendanceSessionClosed(_event: DomainEvent): Promise<void>;
}
