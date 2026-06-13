import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Swap } from '../../database/entities/swap.entity';
import { Pool } from '../../database/entities/pool.entity';
import { getAmountOut, getSpotPrice } from '../../shared/amm-math/constant-product.math';

@Injectable()
export class SwapService {
  constructor(
    @InjectRepository(Swap)
    private readonly swapRepository: Repository<Swap>,
    @InjectRepository(Pool)
    private readonly poolRepository: Repository<Pool>,
  ) {}

  async getQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    poolId?: string,
  ) {
    const pool = poolId
      ? await this.poolRepository.findOne({ where: { id: poolId }, relations: ['token0', 'token1'] })
      : await this.poolRepository.findOne({ where: { isActive: true }, relations: ['token0', 'token1'] });
    if (!pool) throw new NotFoundException('No active pool found');

    const tokenInIsToken0 = pool.token0?.symbol === tokenIn || pool.token0Id === tokenIn;
    const reserveIn = tokenInIsToken0 ? pool.reserve0 : pool.reserve1;
    const reserveOut = tokenInIsToken0 ? pool.reserve1 : pool.reserve0;

    const { amountOut, priceImpact } = getAmountOut(amountIn, reserveIn, reserveOut, pool.feeBps);

    const amountInNum = BigInt(amountIn);
    const amountOutNum = BigInt(amountOut);
    const fee = amountInNum * BigInt(pool.feeBps) / 10000n;

    const effectivePrice = amountOutNum > 0n && amountInNum > 0n
      ? Number(amountOutNum) / Number(amountInNum)
      : 0;

    const severity = priceImpact < 0.01 ? 'low' : priceImpact < 0.05 ? 'medium' : priceImpact < 0.15 ? 'high' : 'critical';

    return {
      tokenIn,
      tokenOut,
      amountIn: amountInNum.toString(),
      amountOut: amountOut.toString(),
      priceImpact,
      route: {
        pools: [{
          poolId: pool.id,
          poolType: pool.poolType,
          tokenIn,
          tokenOut,
          amountIn: amountInNum.toString(),
          amountOut: amountOut.toString(),
          priceImpact,
          fee: pool.feeBps,
        }],
        path: [tokenIn, tokenOut],
        totalPriceImpact: priceImpact,
      },
      effectivePrice,
      fee: fee.toString(),
      priceImpactSeverity: severity,
    };
  }

  async buildSwapTransaction(
    quote: any,
    userAddress: string,
    slippage: number,
    deadline: number,
  ) {
    const amountOut = BigInt(quote?.amountOut || '0');
    const minAmountOut = amountOut - (amountOut * BigInt(Math.round(slippage * 10000))) / 10000n;

    return {
      txXdr: 'AAAAAgAAAABkZXNj...',
      quote,
      userAddress,
      slippage,
      deadline,
      minAmountOut: minAmountOut.toString(),
    };
  }

  async calculatePriceImpact(amountIn: string, reserveIn: string, reserveOut: string) {
    const result = getAmountOut(amountIn, reserveIn, reserveOut, 0);
    return { priceImpact: result.priceImpact };
  }

  async recordSwap(data: {
    poolId: string;
    walletAddress: string;
    tokenInId: string;
    tokenOutId: string;
    amountIn: string;
    amountOut: string;
    amountInUsd?: string;
    amountOutUsd?: string;
    priceImpact?: string;
    feeAmount?: string;
    txHash: string;
  }): Promise<Swap> {
    const swap = new Swap();
    swap.time = new Date();
    swap.poolId = data.poolId;
    swap.walletAddress = data.walletAddress;
    swap.tokenInId = data.tokenInId;
    swap.tokenOutId = data.tokenOutId;
    swap.amountIn = data.amountIn;
    swap.amountOut = data.amountOut;
    swap.amountInUsd = data.amountInUsd || '0';
    swap.amountOutUsd = data.amountOutUsd || '0';
    swap.priceImpact = data.priceImpact || '0';
    swap.feeAmount = data.feeAmount || '0';
    swap.txHash = data.txHash;
    return this.swapRepository.save(swap);
  }

  async getSwapHistory(poolId: string, from?: Date, to?: Date): Promise<Swap[]> {
    const where: Record<string, unknown> = { poolId };
    if (from || to) {
      where.time = Between(from || new Date(0), to || new Date());
    }
    return this.swapRepository.find({ where, order: { time: 'DESC' } as any, take: 100 });
  }

  async getVolume24h(poolId: string): Promise<string> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await this.swapRepository
      .createQueryBuilder('swap')
      .select('COALESCE(SUM(CAST(swap.amountOutUsd AS DECIMAL)), 0)', 'volume')
      .where('swap.poolId = :poolId', { poolId })
      .andWhere('swap.time >= :since', { since: oneDayAgo })
      .getRawOne();
    return result?.volume || '0';
  }

  async getSpotPrice(poolId: string): Promise<number> {
    const pool = await this.poolRepository.findOne({ where: { id: poolId } });
    if (!pool) throw new NotFoundException('Pool not found');
    return getSpotPrice(pool.reserve0, pool.reserve1);
  }
}
