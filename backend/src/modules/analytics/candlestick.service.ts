import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { PriceCandle } from '../../database/entities/price-candle.entity';
import { Swap } from '../../database/entities/swap.entity';

@Injectable()
export class CandlestickService {
  constructor(
    @InjectRepository(PriceCandle)
    private readonly candleRepository: Repository<PriceCandle>,
    @InjectRepository(Swap)
    private readonly swapRepository: Repository<Swap>,
  ) {}

  async getCandles(
    poolId: string,
    interval: string,
    from: Date,
    to: Date,
  ): Promise<PriceCandle[]> {
    const candles = await this.candleRepository.find({
      where: {
        poolId,
        interval,
        time: Between(from, to),
      },
      order: { time: 'ASC' } as any,
    });

    if (candles.length > 0) return candles;

    return this.buildCandlesFromSwaps(poolId, interval, from, to);
  }

  private async buildCandlesFromSwaps(
    poolId: string,
    interval: string,
    from: Date,
    to: Date,
  ): Promise<PriceCandle[]> {
    const swaps = await this.swapRepository.find({
      where: {
        poolId,
        time: Between(from, to),
      },
      order: { time: 'ASC' } as any,
    });

    if (swaps.length === 0) return [];

    const intervalMs = this.parseInterval(interval);
    const buckets = new Map<number, PriceCandle>();

    for (const swap of swaps) {
      const bucketTime = Math.floor(swap.time.getTime() / intervalMs) * intervalMs;
      const price = this.calculateSwapPrice(swap);

      let candle = buckets.get(bucketTime);
      if (!candle) {
        candle = new PriceCandle();
        candle.time = new Date(bucketTime);
        candle.poolId = poolId;
        candle.interval = interval;
        candle.open = price;
        candle.high = price;
        candle.low = price;
        candle.close = price;
        candle.volumeToken0 = '0';
        candle.volumeToken1 = '0';
        candle.volumeUsd = '0';
        candle.txCount = 0;
        buckets.set(bucketTime, candle);
      }

      candle.high = maxStr(candle.high, price);
      candle.low = minStr(candle.low, price);
      candle.close = price;
      candle.volumeToken0 = addStr(candle.volumeToken0, swap.amountIn);
      candle.volumeToken1 = addStr(candle.volumeToken1, swap.amountOut);
      candle.volumeUsd = addStr(candle.volumeUsd, swap.amountInUsd || '0');
      candle.txCount += 1;
    }

    return Array.from(buckets.values()).sort((a, b) => a.time.getTime() - b.time.getTime());
  }

  private calculateSwapPrice(swap: Swap): string {
    const amountIn = BigInt(swap.amountIn || '0');
    const amountOut = BigInt(swap.amountOut || '0');
    if (amountIn <= 0n || amountOut <= 0n) return '0';
    const price = Number(amountOut) / Number(amountIn);
    return price.toFixed(8);
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
}

function maxStr(a: string, b: string): string {
  return BigInt(a) > BigInt(b) ? a : b;
}

function minStr(a: string, b: string): string {
  return BigInt(a) < BigInt(b) ? a : b;
}

function addStr(a: string, b: string): string {
  return (BigInt(a) + BigInt(b)).toString();
}
