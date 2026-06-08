import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway(parseInt(process.env.WS_PORT, 10) || 3001, {
  cors: { origin: '*' },
  namespace: '/pools',
})
export class PoolsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Pool client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Pool client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:pool')
  handleSubscribePool(client: Socket, poolId: string) {
    client.join(`pool:${poolId}`);
  }

  emitReserveUpdate(poolId: string, data: { reserve0: string; reserve1: string; price: number }) {
    this.server.to(`pool:${poolId}`).emit('pool:reserves', data);
  }
}
