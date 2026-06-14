import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Swap } from '../../database/entities/swap.entity';
import { Pool } from '../../database/entities/pool.entity';

@Injectable()
export class FeeRevenueService {
  constructor(
    @InjectRepository(Swap)
    private readonly swapRepository: Repository<Swap>,
    @InjectRepository(Pool)
    private readonly poolRepository: Repository<Pool>,
  ) {}

  async getFeeRevenue24h(poolId?: string): Promise<{ revenueUsd: number; revenueToken: string }> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    let query = this.swapRepository
      .createQueryBuilder('swap')
      .select([
        'COALESCE(SUM(CAST(swap.feeAmount AS DECIMAL)), 0) as fee_amount',
      ])
      .where('swap.time >= :since', { since: oneDayAgo });

    if (poolId) {
      query = query.andWhere('swap.poolId = :poolId', { poolId });
    }

    const result = await query.getRawOne();
    const feeAmount = result?.fee_amount || '0';

    return {
      revenueUsd: parseFloat(feeAmount),
      revenueToken: feeAmount,
    };
  }

  async getProtocolFees(): Promise<{ totalUsd: number; byPool: { poolId: string; revenueUsd: number }[] }> {
    const pools = await this.poolRepository.find({ where: { isActive: true } });
    const byPool: { poolId: string; revenueUsd: number }[] = [];
    let totalUsd = 0;

    for (const pool of pools) {
      const revenue = await this.getFeeRevenue24h(pool.id);
      const poolRevenue = revenue.revenueUsd;
      byPool.push({ poolId: pool.id, revenueUsd: poolRevenue });
      totalUsd += poolRevenue;
    }

    return { totalUsd, byPool };
  }

  async getPoolFeeRevenue(poolId: string): Promise<{ revenueUsd: number; revenueToken: string }> {
    return this.getFeeRevenue24h(poolId);
  }
}
