import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Pool } from '../../database/entities/pool.entity';
import { TvlSnapshot } from '../../database/entities/tvl-snapshot.entity';
import { getSpotPrice } from '../../shared/amm-math/constant-product.math';

@Injectable()
export class TvlService {
  private readonly logger = new Logger(TvlService.name);

  constructor(
    @InjectRepository(Pool)
    private readonly poolRepository: Repository<Pool>,
    @InjectRepository(TvlSnapshot)
    private readonly tvlSnapshotRepository: Repository<TvlSnapshot>,
  ) {}

  async getProtocolTvl(): Promise<{ tvlUsd: number; tvlByPool: { poolId: string; tvlUsd: number }[] }> {
    const pools = await this.poolRepository.find({ where: { isActive: true } });
    const tvlByPool: { poolId: string; tvlUsd: number }[] = [];
    let totalTvl = 0;

    for (const pool of pools) {
      const tvl = this.computePoolTvl(pool);
      tvlByPool.push({ poolId: pool.id, tvlUsd: tvl });
      totalTvl += tvl;
    }

    return { tvlUsd: totalTvl, tvlByPool };
  }

  async getPoolTvl(poolId: string): Promise<{ tvlUsd: number }> {
    const pool = await this.poolRepository.findOne({ where: { id: poolId } });
    if (!pool) return { tvlUsd: 0 };
    return { tvlUsd: this.computePoolTvl(pool) };
  }

  async getTvlHistory(
    poolId?: string,
    interval?: string,
    from?: Date,
    to?: Date,
  ): Promise<TvlSnapshot[]> {
    const where: Record<string, unknown> = {};
    if (poolId) where.poolId = poolId;
    if (from || to) {
      where.time = Between(from || new Date(0), to || new Date());
    }

    const snapshots = await this.tvlSnapshotRepository.find({
      where,
      order: { time: 'ASC' } as any,
    });

    if (interval && interval !== 'raw') {
      const intervalMs = this.parseInterval(interval);
      return this.resampleSnapshots(snapshots, intervalMs);
    }

    return snapshots;
  }

  @Cron('*/5 * * * *')
  async snapshotTvl(): Promise<void> {
    try {
      const { tvlByPool } = await this.getProtocolTvl();
      const now = new Date();

      for (const entry of tvlByPool) {
        const pool = await this.poolRepository.findOne({ where: { id: entry.poolId } });
        if (!pool) continue;

        const snapshot = new TvlSnapshot();
        snapshot.time = now;
        snapshot.poolId = entry.poolId;
        snapshot.tvlUsd = entry.tvlUsd.toString();
        snapshot.reserve0 = pool.reserve0;
        snapshot.reserve1 = pool.reserve1;
        await this.tvlSnapshotRepository.save(snapshot);

        await this.poolRepository.update(entry.poolId, {
          tvlUsd: entry.tvlUsd.toString(),
        });
      }

      this.logger.debug(`TVL snapshot taken for ${tvlByPool.length} pools`);
    } catch (err) {
      this.logger.error('Failed to snapshot TVL', err);
    }
  }

  private computePoolTvl(pool: Pool): number {
    const reserve0Val = Number(pool.reserve0 || '0');
    const reserve1Val = Number(pool.reserve1 || '0');

    if (reserve0Val <= 0 || reserve1Val <= 0) return 0;

    try {
      const spotPrice = getSpotPrice(pool.reserve0, pool.reserve1);
      const token0Price = 1;
      const token1Price = spotPrice;

      return reserve0Val * token0Price + reserve1Val * token1Price;
    } catch {
      return 0;
    }
  }

  private parseInterval(interval: string): number {
    const match = interval.match(/^(\d+)([smhd])$/);
    if (!match) return 3600000;
    const value = parseInt(match[1], 10);
    switch (match[2]) {
      case 's': return value * 1000;
      case 'm': return value * 60000;
      case 'h': return value * 3600000;
      case 'd': return value * 86400000;
      default: return 3600000;
    }
  }

  private resampleSnapshots(snapshots: TvlSnapshot[], intervalMs: number): TvlSnapshot[] {
    if (snapshots.length === 0) return [];

    const resampled: TvlSnapshot[] = [];
    let currentBucket: TvlSnapshot[] = [];
    let bucketStart = snapshots[0].time.getTime();
    const bucketEnd = (t: Date) => t.getTime() < bucketStart + intervalMs;

    for (const snap of snapshots) {
      if (bucketEnd(snap.time)) {
        currentBucket.push(snap);
      } else {
        if (currentBucket.length > 0) {
          resampled.push(currentBucket[currentBucket.length - 1]);
        }
        currentBucket = [snap];
        bucketStart = snap.time.getTime();
      }
    }

    if (currentBucket.length > 0) {
      resampled.push(currentBucket[currentBucket.length - 1]);
    }

    return resampled;
  }
}
