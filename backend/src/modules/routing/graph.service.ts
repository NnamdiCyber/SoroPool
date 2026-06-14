import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import Graph from 'graphology';
import { PoolsService } from '../pools/pools.service';
import { RedisService } from '../../shared/redis/redis.service';

export interface PoolEdge {
  poolId: string;
  poolType: string;
  tokenIn: string;
  tokenOut: string;
  reserveIn: string;
  reserveOut: string;
  feeBps: number;
  tvlUsd: string;
}

@Injectable()
export class GraphService {
  private graph: Graph | null = null;
  private readonly logger = new Logger(GraphService.name);
  private readonly GRAPH_CACHE_KEY = 'routing:graph';

  constructor(
    private readonly poolsService: PoolsService,
    private readonly redisService: RedisService,
  ) {}

  @Cron('*/30 * * * * *')
  async rebuildGraph(): Promise<void> {
    try {
      const newGraph = await this.buildGraph();
      this.graph = newGraph;
      await this.redisService.set(this.GRAPH_CACHE_KEY, this.serializeGraph(newGraph), 60);
    } catch (err) {
      this.logger.error('Failed to rebuild graph', err);
    }
  }

  private serializeGraph(g: Graph) {
    const nodes: string[] = [];
    const edges: Record<string, unknown>[] = [];
    g.forEachNode((node) => nodes.push(node));
    g.forEachEdge((edge, _attrs, _source, _target, _sKey, _tKey) => {
      edges.push({ edge, ...g.getEdgeAttributes(edge) });
    });
    return { nodes, edges };
  }

  async buildGraph(): Promise<Graph> {
    const g = new Graph({ multi: true, type: 'directed' });
    const poolsResult = await this.poolsService.findAll({}, { page: 1, limit: 1000 });
    const pools = poolsResult.data || [];

    for (const pool of pools) {
      if (!pool.isActive) continue;

      const token0Sym = pool.token0?.symbol;
      const token1Sym = pool.token1?.symbol;
      if (!token0Sym || !token1Sym) continue;

      if (!g.hasNode(token0Sym)) g.addNode(token0Sym);
      if (!g.hasNode(token1Sym)) g.addNode(token1Sym);

      g.addEdgeWithKey(
        `${pool.id}:${token0Sym}>${token1Sym}`,
        token0Sym,
        token1Sym,
        {
          poolId: pool.id,
          poolType: pool.poolType,
          tokenIn: token0Sym,
          tokenOut: token1Sym,
          reserveIn: pool.reserve0,
          reserveOut: pool.reserve1,
          feeBps: pool.feeBps,
          tvlUsd: pool.tvlUsd || '0',
        },
      );

      g.addEdgeWithKey(
        `${pool.id}:${token1Sym}>${token0Sym}`,
        token1Sym,
        token0Sym,
        {
          poolId: pool.id,
          poolType: pool.poolType,
          tokenIn: token1Sym,
          tokenOut: token0Sym,
          reserveIn: pool.reserve1,
          reserveOut: pool.reserve0,
          feeBps: pool.feeBps,
          tvlUsd: pool.tvlUsd || '0',
        },
      );
    }

    return g;
  }

  async getGraph(): Promise<Graph> {
    if (this.graph) return this.graph;

    const cached = await this.redisService.get<{ nodes: string[]; edges: Record<string, unknown>[] }>(this.GRAPH_CACHE_KEY);
    if (cached) {
      const g = new Graph({ multi: true, type: 'directed' });
      for (const node of cached.nodes) g.addNode(node);
      for (const edge of cached.edges) {
        const { edge: edgeKey, ...attrs } = edge;
        const [poolId, direction] = (edgeKey as string).split(':');
        const [from, to] = (direction as string).split('>');
        if (!g.hasNode(from)) g.addNode(from);
        if (!g.hasNode(to)) g.addNode(to);
        g.addEdgeWithKey(edgeKey as string, from, to, attrs);
      }
      this.graph = g;
      return g;
    }

    const g = await this.buildGraph();
    this.graph = g;
    await this.redisService.set(this.GRAPH_CACHE_KEY, this.serializeGraph(g), 60);
    return g;
  }

  async getPoolForTokens(tokenA: string, tokenB: string, feeBps?: number): Promise<PoolEdge | null> {
    const g = await this.getGraph();
    if (!g.hasNode(tokenA) || !g.hasNode(tokenB)) return null;

    const candidates: PoolEdge[] = [];
    g.forEachEdge((edge, _attrs, source, target) => {
      if (source === tokenA && target === tokenB) {
        const attrs = g.getEdgeAttributes(edge) as unknown as PoolEdge;
        if (feeBps === undefined || attrs.feeBps === feeBps) {
          candidates.push(attrs);
        }
      }
    });

    if (candidates.length === 0) return null;
    candidates.sort((a, b) => Number(b.tvlUsd) - Number(a.tvlUsd));
    return candidates[0];
  }

  getNodeCount(): number {
    return this.graph ? this.graph.order : 0;
  }

  getEdgeCount(): number {
    return this.graph ? this.graph.size : 0;
  }
}
