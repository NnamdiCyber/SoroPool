import { Injectable } from '@nestjs/common';

@Injectable()
export class SwapService {
  async getQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    poolId?: string,
  ) {
    const _ = { tokenIn, tokenOut, amountIn, poolId };
    return {
      amountIn,
      amountOut: '0',
      priceImpact: 0,
      route: null,
      effectivePrice: 0,
      fee: 0,
    };
  }

  async buildSwapTransaction(
    quote: any,
    userAddress: string,
    slippage: number,
    deadline: number,
  ) {
    const _ = { quote, userAddress, slippage, deadline };
    return { txXdr: '' };
  }

  async calculatePriceImpact(
    amountIn: string,
    reserveIn: string,
    reserveOut: string,
  ) {
    const _ = { amountIn, reserveIn, reserveOut };
    return { priceImpact: 0 };
  }
}
