import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Graph from 'graphology';
import { GraphService, PoolEdge } from './graph.service';
import { getAmountOut } from '../../shared/amm-math/constant-product.math';
import { RedisService } from '../../shared/redis/redis.service';

export interface HopStep {
  poolId: string;
  poolType: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  priceImpact: number;
  fee: number;
}

export interface RouteResult {
  path: string[];
  steps: HopStep[];
  amountOut: string;
  totalPriceImpact: number;
  effectivePrice: number;
}

@Injectable()
export class RoutingService {
  private readonly maxHops: number;
  private readonly maxRoutes: number;
  private readonly logger = new Logger(RoutingService.name);

  constructor(
    private readonly graphService: GraphService,
    private readonly redisService: RedisService,
    configService: ConfigService,
  ) {
    this.maxHops = configService.get<number>('routing.maxHops') || 3;
    this.maxRoutes = configService.get<number>('routing.maxRoutes') || 20;
  }

  async findBestRoute(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    maxHops: number = this.maxHops,
  ): Promise<RouteResult | null> {
    const g = await this.graphService.getGraph();
    if (!g.hasNode(tokenIn) || !g.hasNode(tokenOut)) return null;

    const allPaths = this.findAllPathsInGraph(g, tokenIn, tokenOut, maxHops);
    if (allPaths.length === 0) return null;

    let bestRoute: RouteResult | null = null;
    let bestAmountOut = -1n;

    for (const path of allPaths) {
      const route = await this.simulatePath(path, amountIn);
      if (route && BigInt(route.amountOut) > bestAmountOut) {
        bestRoute = route;
        bestAmountOut = BigInt(route.amountOut);
      }
    }

    return bestRoute;
  }

  async findAllPaths(
    tokenIn: string,
    tokenOut: string,
    maxHops: number = this.maxHops,
  ): Promise<{ paths: RouteResult[]; count: number }> {
    const g = await this.graphService.getGraph();
    if (!g.hasNode(tokenIn) || !g.hasNode(tokenOut)) {
      return { paths: [], count: 0 };
    }

    const rawPaths = this.findAllPathsInGraph(g, tokenIn, tokenOut, maxHops);

    const results: RouteResult[] = [];
    for (const path of rawPaths) {
      results.push({
        path: path,
        steps: [],
        amountOut: '0',
        totalPriceImpact: 0,
        effectivePrice: 0,
      });
    }

    return { paths: results, count: results.length };
  }

  findAllPathsInGraph(
    g: Graph,
    start: string,
    end: string,
    maxHops: number,
  ): string[][] {
    const results: string[][] = [];

    const dfs = (current: string, target: string, visited: Set<string>, path: string[]) => {
      if (path.length - 1 >= maxHops) return;
      if (current === target && path.length > 1) {
        results.push([...path]);
        return;
      }

      if (results.length >= this.maxRoutes) return;

      g.forEachNeighbor(current, (neighbor) => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          path.push(neighbor);
          dfs(neighbor, target, visited, path);
          path.pop();
          visited.delete(neighbor);
        }
      });
    };

    const visited = new Set<string>([start]);
    dfs(start, end, visited, [start]);

    results.sort((a, b) => a.length - b.length);

    return results.slice(0, this.maxRoutes);
  }

  async simulatePath(
    path: string[],
    amountIn: bigint,
  ): Promise<RouteResult | null> {
    const g = await this.graphService.getGraph();
    const steps: HopStep[] = [];
    let currentAmount = amountIn;
    let totalPriceImpact = 0;

    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];

      const edge = this.findBestEdge(g, from, to);
      if (!edge) return null;

      const reserveIn = BigInt(edge.reserveIn);
      const reserveOut = BigInt(edge.reserveOut);

      if (currentAmount <= 0n || reserveIn <= 0n || reserveOut <= 0n) return null;

      try {
        const result = getAmountOut(
          currentAmount.toString(),
          reserveIn.toString(),
          reserveOut.toString(),
          edge.feeBps,
        );

        const amountOut = BigInt(result.amountOut);
        if (amountOut <= 0n) return null;

        totalPriceImpact += result.priceImpact;

        steps.push({
          poolId: edge.poolId,
          poolType: edge.poolType,
          tokenIn: from,
          tokenOut: to,
          amountIn: currentAmount.toString(),
          amountOut: amountOut.toString(),
          priceImpact: result.priceImpact,
          fee: edge.feeBps,
        });

        currentAmount = amountOut;
      } catch {
        return null;
      }
    }

    const finalAmount = currentAmount;
    const effectivePrice = amountIn > 0n && finalAmount > 0n
      ? Number(finalAmount) / Number(amountIn)
      : 0;

    return {
      path,
      steps,
      amountOut: finalAmount.toString(),
      totalPriceImpact,
      effectivePrice,
    };
  }

  private findBestEdge(g: Graph, from: string, to: string): PoolEdge | null {
    const candidates: PoolEdge[] = [];
    g.forEachEdge((edge, _attrs, source, target) => {
      if (source === from && target === to) {
        candidates.push(g.getEdgeAttributes(edge) as unknown as PoolEdge);
      }
    });

    if (candidates.length === 0) return null;
    candidates.sort((a, b) => Number(b.tvlUsd) - Number(a.tvlUsd));
    return candidates[0];
  }
}
