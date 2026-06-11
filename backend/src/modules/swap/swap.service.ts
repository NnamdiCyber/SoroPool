import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Swap } from '../../database/entities/swap.entity';
import { Pool } from '../../database/entities/pool.entity';

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
      ? await this.poolRepository.findOne({ where: { id: poolId } })
      : await this.poolRepository.findOne({ where: { isActive: true } });
    if (!pool) throw new NotFoundException('No active pool found');

    const reserveIn = pool.reserve0;
    const reserveOut = pool.reserve1;
    const feeBps = pool.feeBps;
    const amountInNum = BigInt(amountIn);
    const reserveInNum = BigInt(reserveIn);
    const reserveOutNum = BigInt(reserveOut);

    const fee = amountInNum * BigInt(feeBps) / BigInt(10000);
    const amountInAfterFee = amountInNum - fee;
    const amountOutNum = (amountInAfterFee * reserveOutNum) / (reserveInNum + amountInAfterFee);

    const numerator = BigInt(amountIn) * BigInt(10000);
    const denominator = BigInt(amountIn) + BigInt(2) * reserveInNum;
    const priceImpact = denominator > 0 ? Number((numerator * BigInt(10000)) / denominator) / 10000 : 0;

    return {
      amountIn: amountInNum.toString(),
      amountOut: amountOutNum.toString(),
      priceImpact,
      route: { pools: [{ poolId: pool.id, poolType: pool.poolType }], path: [tokenIn, tokenOut], totalPriceImpact: priceImpact },
      effectivePrice: amountOutNum > 0 && amountInNum > 0 ? Number(amountOutNum) / Number(amountInNum) : 0,
      fee: fee.toString(),
    };
  }

  async buildSwapTransaction(
    quote: any,
    userAddress: string,
    slippage: number,
    deadline: number,
  ) {
    return { txXdr: 'AAAAAgAAAABkZXNj...', quote, userAddress, slippage, deadline };
  }

  async calculatePriceImpact(amountIn: string, reserveIn: string, reserveOut: string) {
    const a = BigInt(amountIn);
    const rIn = BigInt(reserveIn);
    const result = a * BigInt(10000) / (a + BigInt(2) * rIn);
    return { priceImpact: Number(result) / 10000 };
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
}
