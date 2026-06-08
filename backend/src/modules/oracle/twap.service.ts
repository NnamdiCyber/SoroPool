import { Injectable } from '@nestjs/common';

@Injectable()
export class TwapService {
  async getTwapPrice(tokenIn: string, tokenOut: string, windowSeconds: number) {
    const _ = { tokenIn, tokenOut, windowSeconds };
    return { price: 0, timestamp: Date.now() };
  }

  async getSpotPrice(tokenIn: string, tokenOut: string) {
    const _ = { tokenIn, tokenOut };
    return { price: 0 };
  }
}
