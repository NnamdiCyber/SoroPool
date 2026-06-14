import { Injectable, Logger } from '@nestjs/common';
import { RoutingService, RouteResult, HopStep } from './routing.service';

export interface SplitRouteResult {
  pathA: string[];
  pathB: string[];
  stepsA: HopStep[];
  stepsB: HopStep[];
  amountInA: string;
  amountInB: string;
  amountOutA: string;
  amountOutB: string;
  totalAmountOut: string;
  totalPriceImpact: number;
  splitRatio: number;
  effectivePrice: number;
}

@Injectable()
export class SplitRouteService {
  private readonly logger = new Logger(SplitRouteService.name);

  constructor(private readonly routingService: RoutingService) {}

  async optimizeSplit(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    maxHops: number = 3,
  ): Promise<SplitRouteResult | null> {
    const bestRoute = await this.routingService.findBestRoute(tokenIn, tokenOut, amountIn, maxHops);
    if (!bestRoute || bestRoute.steps.length === 0) return null;

    const allPathsResult = await this.routingService.findAllPaths(tokenIn, tokenOut, maxHops);
    const pathStrings = allPathsResult.paths.map((p) => p.path);

    const pathsWithSimulation: { path: string[]; route: RouteResult | null }[] = [];
    for (const path of pathStrings) {
      const route = await this.routingService.simulatePath(path, amountIn);
      pathsWithSimulation.push({ path, route });
    }

    const validPaths = pathsWithSimulation
      .filter((p) => p.route !== null && BigInt(p.route!.amountOut) > 0n)
      .sort((a, b) => {
        const diff = BigInt(b.route!.amountOut) - BigInt(a.route!.amountOut);
        return diff > 0n ? 1 : diff < 0n ? -1 : 0;
      });

    if (validPaths.length < 2) return null;

    const pathA = validPaths[0];
    const pathB = validPaths[1];

    let bestSplit: SplitRouteResult | null = null;
    let bestTotalOut = BigInt(pathA.route!.amountOut);

    for (let ratio = 0.05; ratio <= 0.95; ratio += 0.05) {
      const amountA = (amountIn * BigInt(Math.round(ratio * 100))) / 100n;
      const amountB = amountIn - amountA;

      if (amountA <= 0n || amountB <= 0n) continue;

      const routeA = await this.routingService.simulatePath(pathA.path, amountA);
      const routeB = await this.routingService.simulatePath(pathB.path, amountB);

      if (!routeA || !routeB) continue;

      const outA = BigInt(routeA.amountOut);
      const outB = BigInt(routeB.amountOut);
      const totalOut = outA + outB;

      if (totalOut > bestTotalOut) {
        bestTotalOut = totalOut;
        bestSplit = {
          pathA: pathA.path,
          pathB: pathB.path,
          stepsA: routeA.steps,
          stepsB: routeB.steps,
          amountInA: amountA.toString(),
          amountInB: amountB.toString(),
          amountOutA: outA.toString(),
          amountOutB: outB.toString(),
          totalAmountOut: totalOut.toString(),
          totalPriceImpact: routeA.totalPriceImpact + routeB.totalPriceImpact,
          splitRatio: Math.round(ratio * 100),
          effectivePrice: totalOut > 0n ? Number(totalOut) / Number(amountIn) : 0,
        };
      }
    }

    if (bestSplit && bestTotalOut > BigInt(bestRoute.amountOut)) {
      return bestSplit;
    }

    return null;
  }
}
