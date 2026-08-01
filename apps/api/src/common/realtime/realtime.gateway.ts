import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { verify } from 'jsonwebtoken';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  path: '/api/v1/socket.io',
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  async handleConnection(client: Socket) {
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      this.logger.warn(`Client connect rejected (No token): ${client.id}`);
      client.disconnect(true);
      return;
    }

    try {
      const secret = process.env.AUTH_SECRET;
      if (!secret) {
        this.logger.fatal(
          'AUTH_SECRET is not set. WebSocket authentication cannot proceed.',
        );
        client.disconnect(true);
        return;
      }
      const decoded = verify(token, secret) as any;
      client.data.user = decoded;

      const role = decoded.role;
      // Join a room for the user's role, and one for their specific company
      client.join(`role:${role}`);
      client.join(`user:${decoded.sub}`);
      if (decoded.companyId) {
        client.join(`company:${decoded.companyId}`);
        client.join(`role:${role}:company:${decoded.companyId}`);
      }

      this.logger.debug(`Client connected: ${client.id} (Role: ${role})`);
    } catch (e) {
      this.logger.warn(`Client connect rejected (Invalid token): ${client.id}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  /**
   * Broadcast an event to the Owner dashboard specifically
   */
  broadcastToOwners(companyId: string, eventName: string, data: any) {
    this.server.to(`role:OWNER:company:${companyId}`).emit(eventName, data);
  }

  broadcastToUser(userId: string, eventName: string, data: any) {
    this.server.to(`user:${userId}`).emit(eventName, data);
  }

  broadcastToCompany(companyId: string, eventName: string, data: any) {
    this.server.to(`company:${companyId}`).emit(eventName, data);
  }
}
