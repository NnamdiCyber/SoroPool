import { Injectable } from '@nestjs/common';

@Injectable()
export class QuoteAggregatorService {
  async getBestQuote(tokenIn: string, tokenOut: string, amountIn: string) {
    const _ = { tokenIn, tokenOut, amountIn };
    return null;
  }
}
