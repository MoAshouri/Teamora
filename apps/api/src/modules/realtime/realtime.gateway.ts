import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';

type SocketAuth = {
  userId: string;
  companyId: string;
  role: string;
};

@WebSocketGateway({
  cors: {
    origin: process.env.API_CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/presence',
})
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ||
        (client.handshake.headers.cookie
          ?.split(';')
          .map((c) => c.trim())
          .find((c) => c.startsWith('access_token='))
          ?.split('=')[1] ?? null);

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwt.verify<{ sub: string }>(token, {
        secret: process.env.JWT_SECRET ?? 'dev-secret',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { ownedCompany: true, membership: true },
      });
      if (!user) {
        client.disconnect();
        return;
      }

      const companyId =
        user.role === 'ADMIN'
          ? user.ownedCompany?.id
          : user.membership?.companyId;
      if (!companyId) {
        client.disconnect();
        return;
      }

      const auth: SocketAuth = {
        userId: user.id,
        companyId,
        role: user.role,
      };
      client.data.auth = auth;
      await client.join(`company:${companyId}`);
    } catch {
      client.disconnect();
    }
  }

  emitPresence(companyId: string, payload: unknown) {
    this.server.to(`company:${companyId}`).emit('presence', payload);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket, @MessageBody() data: unknown) {
    return { event: 'pong', data };
  }
}
