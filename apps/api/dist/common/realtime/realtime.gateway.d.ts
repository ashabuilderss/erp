import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    broadcastToOwners(companyId: string, eventName: string, data: any): void;
    broadcastToUser(userId: string, eventName: string, data: any): void;
    broadcastToCompany(companyId: string, eventName: string, data: any): void;
}
