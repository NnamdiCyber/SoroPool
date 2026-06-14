import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RoutingService, RouteResult, HopStep } from './routing.service';
import { SplitRouteService, SplitRouteResult } from './split-route.service';
import { RedisService } from '../../shared/redis/redis.service';

export interface AggregatedQuote {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  priceImpact: number;
  route: {
    pools: HopStep[];
    path: string[];
    totalPriceImpact: number;
  };
  splitRoute: SplitRouteResult | null;
  effectivePrice: number;
  fee: string;
  priceImpactSeverity: 'low' | 'medium' | 'high' | 'critical';
}

@Injectable()
export class QuoteAggregatorService {
  private readonly cacheTtlMs: number;
  private readonly logger = new Logger(QuoteAggregatorService.name);

  constructor(
    private readonly routingService: RoutingService,
    private readonly splitRouteService: SplitRouteService,
    private readonly redisService: RedisService,
    configService: ConfigService,
  ) {
    this.cacheTtlMs = configService.get<number>('routing.cacheTtlMs') || 2000;
  }

  async getBestQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
  ): Promise<AggregatedQuote | null> {
    const cacheKey = `quote:${tokenIn}:${tokenOut}:${amountIn}`;

    const cached = await this.redisService.get<AggregatedQuote>(cacheKey);
    if (cached) return cached;

    const amountInBig = BigInt(amountIn);

    const bestRoute = await this.routingService.findBestRoute(tokenIn, tokenOut, amountInBig);
    if (!bestRoute) return null;

    const splitRoute = await this.splitRouteService.optimizeSplit(tokenIn, tokenOut, amountInBig);

    const bestAmountOut = bestRoute.amountOut;
    const splitAmountOut = splitRoute ? splitRoute.totalAmountOut : '0';

    const useSplit = splitRoute && BigInt(splitAmountOut) > BigInt(bestAmountOut);

    const finalAmountOut = useSplit ? splitAmountOut : bestAmountOut;
    const finalRoute = useSplit ? null : bestRoute;
    const totalPriceImpact = useSplit ? splitRoute!.totalPriceImpact : bestRoute.totalPriceImpact;

    const amountInNum = BigInt(amountIn);
    const amountOutNum = BigInt(finalAmountOut);

    const effectivePrice = amountOutNum > 0n && amountInNum > 0n
      ? Number(amountOutNum) / Number(amountInNum)
      : 0;

    const poolFees = bestRoute.steps.reduce((sum, s) => sum + s.fee, 0);
    const totalFee = poolFees > 0
      ? (amountInNum * BigInt(poolFees) / BigInt(10000 * bestRoute.steps.length)).toString()
      : '0';

    const severity = totalPriceImpact < 0.01 ? 'low' : totalPriceImpact < 0.05 ? 'medium' : totalPriceImpact < 0.15 ? 'high' : 'critical';

    const quote: AggregatedQuote = {
      tokenIn,
      tokenOut,
      amountIn: amountIn.toString(),
      amountOut: finalAmountOut,
      priceImpact: totalPriceImpact,
      route: {
        pools: finalRoute ? finalRoute.steps : (useSplit ? [...splitRoute!.stepsA, ...splitRoute!.stepsB] : []),
        path: finalRoute ? finalRoute.path : (useSplit ? [...splitRoute!.pathA, ...splitRoute!.pathB] : []),
        totalPriceImpact,
      },
      splitRoute,
      effectivePrice,
      fee: totalFee,
      priceImpactSeverity: severity,
    };

    const cacheTtlSeconds = Math.max(1, Math.floor(this.cacheTtlMs / 1000));
    await this.redisService.set(cacheKey, quote, cacheTtlSeconds);

    return quote;
  }
}
