import { Injectable } from '@nestjs/common';

@Injectable()
export class CandlestickService {
  async getCandles(poolId: string, interval: string, from: Date, to: Date) {
    const _ = { poolId, interval, from, to };
    return [];
  }
}
