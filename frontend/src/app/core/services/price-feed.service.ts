import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PriceFeedService {
  private ws: WebSocket | null = null;
  readonly poolReserves$ = new Subject<any>();
  readonly quoteUpdates$ = new Subject<any>();
  readonly protocolStats$ = new Subject<any>();

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this.ws = new WebSocket(environment.wsUrl);

    this.ws.onopen = () => {
      this.ws?.send(JSON.stringify({ type: 'subscribe:stats' }));
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'pool:reserves') this.poolReserves$.next(data);
      if (data.type === 'quote:update') this.quoteUpdates$.next(data);
      if (data.type === 'stats:update') this.protocolStats$.next(data);
    };

    this.ws.onclose = () => {
      setTimeout(() => this.connect(), 3000);
    };
  }

  subscribePool(poolId: string) {
    this.ws?.send(JSON.stringify({ type: 'subscribe:pool', poolId }));
  }

  subscribeQuote(tokenIn: string, tokenOut: string, amountIn: string) {
    this.ws?.send(JSON.stringify({ type: 'subscribe:quote', tokenIn, tokenOut, amountIn }));
  }
}
