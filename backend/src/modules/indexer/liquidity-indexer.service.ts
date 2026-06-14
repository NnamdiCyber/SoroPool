import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LpPosition } from '../../database/entities/lp-position.entity';
import { ClPosition } from '../../database/entities/cl-position.entity';
import { Pool } from '../../database/entities/pool.entity';
import { IndexerEvent } from './stellar-indexer.service';
import { PoolsGateway } from '../pools/pools.gateway';
import { getSpotPrice } from '../../shared/amm-math/constant-product.math';

@Injectable()
export class LiquidityIndexerService {
  private readonly logger = new Logger(LiquidityIndexerService.name);

  constructor(
    @InjectRepository(LpPosition)
    private readonly lpPositionRepository: Repository<LpPosition>,
    @InjectRepository(ClPosition)
    private readonly clPositionRepository: Repository<ClPosition>,
    @InjectRepository(Pool)
    private readonly poolRepository: Repository<Pool>,
    private readonly poolsGateway: PoolsGateway,
  ) {}

  async indexMint(event: IndexerEvent): Promise<void> {
    try {
      const { data } = event;
      const poolAddress = (data.poolAddress as string) || '';

      const pool = await this.poolRepository.findOne({ where: { contractAddress: poolAddress } });
      if (!pool) {
        this.logger.warn(`Pool not found for mint event: ${poolAddress}`);
        return;
      }

      const walletAddress = (data.provider as string) || (data.caller as string) || '';
      const amountA = BigInt((data.amountA as string) || '0');
      const amountB = BigInt((data.amountB as string) || '0');

      if (amountA <= 0n || amountB <= 0n || !walletAddress) return;

      const existing = await this.lpPositionRepository.findOne({
        where: { walletAddress, poolId: pool.id },
      });

      if (existing) {
        existing.lpTokenAmount = (BigInt(existing.lpTokenAmount) + amountA).toString();
        existing.token0Deposited = (BigInt(existing.token0Deposited) + amountA).toString();
        existing.token1Deposited = (BigInt(existing.token1Deposited) + amountB).toString();
        await this.lpPositionRepository.save(existing);
      } else {
        const position = new LpPosition();
        position.walletAddress = walletAddress;
        position.poolId = pool.id;
        position.lpTokenAmount = amountA.toString();
        position.token0Deposited = amountA.toString();
        position.token1Deposited = amountB.toString();
        position.feesEarnedToken0 = '0';
        position.feesEarnedToken1 = '0';
        await this.lpPositionRepository.save(position);
      }

      const newReserve0 = (BigInt(pool.reserve0) + amountA).toString();
      const newReserve1 = (BigInt(pool.reserve1) + amountB).toString();
      const lpCount = (await this.lpPositionRepository.count({ where: { poolId: pool.id } }));

      await this.poolRepository.update(pool.id, {
        reserve0: newReserve0,
        reserve1: newReserve1,
        lpCount,
      });

      this.emitReserveUpdate(pool.id, newReserve0, newReserve1);
      this.logger.debug(`Indexed mint: ${walletAddress} +${amountA}/${amountB} on ${pool.id}`);
    } catch (err) {
      this.logger.error('Failed to index mint event', err);
    }
  }

  async indexBurn(event: IndexerEvent): Promise<void> {
    try {
      const { data } = event;
      const poolAddress = (data.poolAddress as string) || '';

      const pool = await this.poolRepository.findOne({ where: { contractAddress: poolAddress } });
      if (!pool) {
        this.logger.warn(`Pool not found for burn event: ${poolAddress}`);
        return;
      }

      const walletAddress = (data.provider as string) || (data.caller as string) || '';
      const amountA = BigInt((data.amountA as string) || '0');
      const amountB = BigInt((data.amountB as string) || '0');

      if (amountA <= 0n || amountB <= 0n || !walletAddress) return;

      const existing = await this.lpPositionRepository.findOne({
        where: { walletAddress, poolId: pool.id },
      });

      if (existing) {
        const newLpAmount = BigInt(existing.lpTokenAmount) - amountA;
        existing.lpTokenAmount = newLpAmount > 0n ? newLpAmount.toString() : '0';
        existing.token0Deposited = (BigInt(existing.token0Deposited) - amountA).toString();
        existing.token1Deposited = (BigInt(existing.token1Deposited) - amountB).toString();
        await this.lpPositionRepository.save(existing);
      }

      const newReserve0 = BigInt(pool.reserve0) - amountA;
      const newReserve1 = BigInt(pool.reserve1) - amountB;
      const finalReserve0 = newReserve0 > 0n ? newReserve0.toString() : '0';
      const finalReserve1 = newReserve1 > 0n ? newReserve1.toString() : '0';
      const lpCount = (await this.lpPositionRepository.count({ where: { poolId: pool.id } }));

      await this.poolRepository.update(pool.id, {
        reserve0: finalReserve0,
        reserve1: finalReserve1,
        lpCount,
      });

      this.emitReserveUpdate(pool.id, finalReserve0, finalReserve1);
      this.logger.debug(`Indexed burn: ${walletAddress} -${amountA}/${amountB} on ${pool.id}`);
    } catch (err) {
      this.logger.error('Failed to index burn event', err);
    }
  }

  private emitReserveUpdate(poolId: string, reserve0: string, reserve1: string): void {
    const r0 = Number(reserve0);
    const r1 = Number(reserve1);
    const price = r0 > 0 ? r1 / r0 : 0;
    this.poolsGateway.emitReserveUpdate(poolId, { reserve0, reserve1, price });
  }
}
