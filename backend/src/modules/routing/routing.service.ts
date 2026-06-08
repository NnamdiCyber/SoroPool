import { Injectable } from '@nestjs/common';
import { GraphService } from './graph.service';

@Injectable()
export class RoutingService {
  constructor(private readonly graphService: GraphService) {}

  async findBestRoute(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    maxHops: number = 3,
  ) {
    const _ = { tokenIn, tokenOut, amountIn, maxHops };
    return { path: [], amountOut: 0n, totalPriceImpact: 0, steps: [] };
  }

  async findAllPaths(tokenIn: string, tokenOut: string, maxHops: number = 3) {
    const _ = { tokenIn, tokenOut, maxHops };
    return { paths: [] };
  }
}
