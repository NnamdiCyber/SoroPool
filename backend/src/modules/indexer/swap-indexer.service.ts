import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Swap } from '../../database/entities/swap.entity';
import { Pool } from '../../database/entities/pool.entity';
import { IndexerEvent } from './stellar-indexer.service';
import { RedisService } from '../../shared/redis/redis.service';
import { getAmountOut } from '../../shared/amm-math/constant-product.math';

@Injectable()
export class SwapIndexerService {
  private readonly logger = new Logger(SwapIndexerService.name);

  constructor(
    @InjectRepository(Swap)
    private readonly swapRepository: Repository<Swap>,
    @InjectRepository(Pool)
    private readonly poolRepository: Repository<Pool>,
    private readonly redisService: RedisService,
  ) {}

  async indexSwap(event: IndexerEvent): Promise<void> {
    try {
      const { data } = event;
      const poolAddress = data.poolAddress as string || (event.txHash);

      const pool = await this.poolRepository.findOne({ where: { contractAddress: poolAddress }, relations: ['token0', 'token1'] });
      if (!pool) {
        this.logger.warn(`Pool not found for swap event: ${poolAddress}`);
        return;
      }

      const amountIn = (data.amountIn as string) || '0';
      const amountOut = (data.amountOut as string) || '0';

      if (BigInt(amountIn) <= 0n || BigInt(amountOut) <= 0n) return;

      const tokenInIsToken0 = (data.tokenIn as string) === pool.token0?.symbol || (data.tokenIn as string) === pool.token0Id;
      const amountInUsd = this.estimateUsdValue(amountIn, pool, tokenInIsToken0);
      const amountOutUsd = this.estimateUsdValue(amountOut, pool, !tokenInIsToken0);

      const swap = new Swap();
      swap.time = new Date(event.timestamp);
      swap.poolId = pool.id;
      swap.walletAddress = (data.caller as string) || (data.walletAddress as string) || '';
      swap.tokenInId = tokenInIsToken0 ? pool.token0Id : pool.token1Id;
      swap.tokenOutId = tokenInIsToken0 ? pool.token1Id : pool.token0Id;
      swap.amountIn = amountIn;
      swap.amountOut = amountOut;
      swap.amountInUsd = amountInUsd;
      swap.amountOutUsd = amountOutUsd;
      swap.priceImpact = '0';
      swap.feeAmount = pool.feeBps ? (BigInt(amountIn) * BigInt(pool.feeBps) / 10000n).toString() : '0';
      swap.txHash = event.txHash;

      await this.swapRepository.save(swap);

      await this.updatePoolVolume(pool.id, amountInUsd, amountOutUsd, amountIn, amountOut, pool);

      const cacheKey = `quote:*:${pool.token0?.symbol}:${pool.token1?.symbol}:*`;
      await this.invalidateQuoteCaches(cacheKey);
      await this.invalidateQuoteCaches(`quote:*:${pool.token1?.symbol}:${pool.token0?.symbol}:*`);

      this.logger.debug(`Indexed swap: ${pool.id} ${amountIn} -> ${amountOut}`);
    } catch (err) {
      this.logger.error('Failed to index swap event', err);
    }
  }

  private async updatePoolVolume(
    poolId: string,
    amountInUsd: string,
    amountOutUsd: string,
    amountIn: string,
    amountOut: string,
    pool: Pool,
  ): Promise<void> {
    const volumeUsd = (BigInt(amountInUsd || '0') + BigInt(amountOutUsd || '0')) / 2n;
    const currentVolume24h = BigInt(pool.volume24hUsd || '0');
    const newVolume24h = currentVolume24h + volumeUsd;

    const feeAmount = BigInt(amountIn) * BigInt(pool.feeBps || 0) / 10000n;
    const currentFees24h = BigInt(pool.feeRevenue24h || '0');
    const newFees24h = currentFees24h + feeAmount;

    await this.poolRepository.update(poolId, {
      reserve0: pool.reserve0,
      reserve1: pool.reserve1,
      volume24hUsd: newVolume24h.toString(),
      feeRevenue24h: newFees24h.toString(),
    });
  }

  private estimateUsdValue(amount: string, pool: Pool, isToken0: boolean): string {
    const reserve0 = BigInt(pool.reserve0 || '0');
    const reserve1 = BigInt(pool.reserve1 || '0');
    const amountBig = BigInt(amount);

    if (reserve0 <= 0n || reserve1 <= 0n) return '0';

    const price = isToken0
      ? Number(reserve1) / Number(reserve0)
      : Number(reserve0) / Number(reserve1);

    const usdValue = Math.floor(Number(amountBig) * price);
    return usdValue > 0 ? usdValue.toString() : '0';
  }

  private async invalidateQuoteCaches(pattern: string): Promise<void> {
    try {
      const keys = await this.redisService['get'](pattern.replace('*', ''));
      if (keys) await this.redisService.del(pattern.replace('*', ''));
    } catch {
      // Best effort cache invalidation
    }
    await this.redisService.del(`routing:graph`);
  }
}
