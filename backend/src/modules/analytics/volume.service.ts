import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Swap } from '../../database/entities/swap.entity';

@Injectable()
export class VolumeService {
  constructor(
    @InjectRepository(Swap)
    private readonly swapRepository: Repository<Swap>,
  ) {}

  async getVolume24h(poolId?: string): Promise<{ volumeUsd: number; volumeTokenA: string; volumeTokenB: string }> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.getVolumeSince(oneDayAgo, poolId);
  }

  async getVolume7d(poolId?: string): Promise<{ volumeUsd: number; volumeTokenA: string; volumeTokenB: string }> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return this.getVolumeSince(sevenDaysAgo, poolId);
  }

  async getVolumeTotal(poolId?: string): Promise<{ volumeUsd: number; volumeTokenA: string; volumeTokenB: string }> {
    return this.getVolumeSince(new Date(0), poolId);
  }

  private async getVolumeSince(
    since: Date,
    poolId?: string,
  ): Promise<{ volumeUsd: number; volumeTokenA: string; volumeTokenB: string }> {
    let query = this.swapRepository
      .createQueryBuilder('swap')
      .select([
        'COALESCE(SUM(CAST(swap.amountInUsd AS DECIMAL)), 0) as volume_usd',
        'COALESCE(SUM(CAST(swap.amountIn AS DECIMAL)), 0) as volume_token_in',
        'COALESCE(SUM(CAST(swap.amountOut AS DECIMAL)), 0) as volume_token_out',
      ])
      .where('swap.time >= :since', { since });

    if (poolId) {
      query = query.andWhere('swap.poolId = :poolId', { poolId });
    }

    const result = await query.getRawOne();
    return {
      volumeUsd: parseFloat(result?.volume_usd || '0'),
      volumeTokenA: result?.volume_token_in || '0',
      volumeTokenB: result?.volume_token_out || '0',
    };
  }
}
