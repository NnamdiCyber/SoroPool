import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway(parseInt(process.env.WS_PORT || '3001', 10), {
  cors: { origin: '*' },
  namespace: '/swap',
})
export class SwapGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('subscribe:quote')
  handleSubscribeQuote(
    client: Socket,
    data: { tokenIn: string; tokenOut: string; amountIn: string },
  ) {
    client.join(`quote:${data.tokenIn}:${data.tokenOut}`);
  }

  emitQuoteUpdate(
    tokenIn: string,
    tokenOut: string,
    data: { amountOut: string; route: any; priceImpact: number },
  ) {
    this.server.to(`quote:${tokenIn}:${tokenOut}`).emit('quote:update', data);
  }
}
