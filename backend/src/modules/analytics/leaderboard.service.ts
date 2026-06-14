import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pool } from '../../database/entities/pool.entity';
import { LpPosition } from '../../database/entities/lp-position.entity';
import { Swap } from '../../database/entities/swap.entity';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(Pool)
    private readonly poolRepository: Repository<Pool>,
    @InjectRepository(LpPosition)
    private readonly lpPositionRepository: Repository<LpPosition>,
    @InjectRepository(Swap)
    private readonly swapRepository: Repository<Swap>,
  ) {}

  async getTopPools(
    metric: string,
    limit: number = 10,
  ): Promise<{ poolId: string; poolType: string; value: number }[]> {
    const pools = await this.poolRepository.find({
      where: { isActive: true },
      order: this.getOrderForMetric(metric),
      take: limit,
    });

    return pools.map((pool) => ({
      poolId: pool.id,
      poolType: pool.poolType,
      value: this.getMetricValue(pool, metric),
    }));
  }

  async getTopLps(limit: number = 10): Promise<{ walletAddress: string; totalValue: number; poolCount: number }[]> {
    const positions = await this.lpPositionRepository.find();
    const lpMap = new Map<string, { totalValue: number; poolCount: number }>();

    for (const pos of positions) {
      const val = Number(pos.token0Deposited) + Number(pos.token1Deposited);
      const existing = lpMap.get(pos.walletAddress);
      if (existing) {
        existing.totalValue += val;
        existing.poolCount += 1;
      } else {
        lpMap.set(pos.walletAddress, { totalValue: val, poolCount: 1 });
      }
    }

    return Array.from(lpMap.entries())
      .map(([walletAddress, data]) => ({ walletAddress, ...data }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, limit);
  }

  private getOrderForMetric(metric: string): Record<string, 'ASC' | 'DESC'> {
    switch (metric) {
      case 'tvl':
        return { tvlUsd: 'DESC' };
      case 'volume':
        return { volume24hUsd: 'DESC' };
      case 'fees':
        return { feeRevenue24h: 'DESC' };
      case 'apr':
        return { feeRevenue24h: 'DESC' };
      case 'liquidity':
        return { reserve0: 'DESC' };
      default:
        return { tvlUsd: 'DESC' };
    }
  }

  private getMetricValue(pool: Pool, metric: string): number {
    switch (metric) {
      case 'tvl':
        return Number(pool.tvlUsd || '0');
      case 'volume':
        return Number(pool.volume24hUsd || '0');
      case 'fees':
        return Number(pool.feeRevenue24h || '0');
      case 'apr': {
        const tvl = Number(pool.tvlUsd || '0');
        const fees = Number(pool.feeRevenue24h || '0');
        return tvl > 0 ? (fees * 365 * 100) / tvl : 0;
      }
      case 'liquidity':
        return Number(pool.reserve0) + Number(pool.reserve1);
      default:
        return Number(pool.tvlUsd || '0');
    }
  }
}
