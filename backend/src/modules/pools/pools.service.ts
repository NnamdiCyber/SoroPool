import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pool } from '../../database/entities/pool.entity';

@Injectable()
export class PoolsService {
  constructor(
    @InjectRepository(Pool)
    private readonly poolRepository: Repository<Pool>,
  ) {}

  async findAll(
    filters: { poolType?: string; tokenA?: string; tokenB?: string } = {},
    pagination: { page?: number; limit?: number } = {},
  ) {
    const query = this.poolRepository.createQueryBuilder('pool')
      .leftJoinAndSelect('pool.token0', 'token0')
      .leftJoinAndSelect('pool.token1', 'token1');
    if (filters.poolType) query.andWhere('pool.poolType = :poolType', { poolType: filters.poolType });
    if (filters.tokenA) query.andWhere('pool.token0.symbol = :tokenA', { tokenA: filters.tokenA });
    if (filters.tokenB) query.andWhere('pool.token1.symbol = :tokenB', { tokenB: filters.tokenB });
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const [data, total] = await query.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, total, page, limit };
  }

  async findById(id: string) {
    const pool = await this.poolRepository.findOne({ where: { id }, relations: ['token0', 'token1'] });
    if (!pool) throw new NotFoundException('Pool not found');
    return pool;
  }

  async findByAddress(contractAddress: string) {
    return this.poolRepository.findOne({ where: { contractAddress }, relations: ['token0', 'token1'] });
  }

  async findByTokens(tokenA: string, tokenB: string, feeBps?: number) {
    const query = this.poolRepository.createQueryBuilder('pool')
      .leftJoinAndSelect('pool.token0', 'token0')
      .leftJoinAndSelect('pool.token1', 'token1')
      .where('(token0.symbol = :tokenA AND token1.symbol = :tokenB)', { tokenA, tokenB });
    if (feeBps) query.andWhere('pool.feeBps = :feeBps', { feeBps });
    return query.getMany();
  }

  async getPoolStats(id: string) {
    const pool = await this.findById(id);
    const reserve0Num = Number(pool.reserve0);
    const reserve1Num = Number(pool.reserve1);
    const spotPrice = reserve0Num > 0 ? reserve1Num / reserve0Num : 0;
    const tvl = pool.tvlUsd ? Number(pool.tvlUsd) : 0;
    const volume24h = pool.volume24hUsd ? Number(pool.volume24hUsd) : 0;
    const fees24h = pool.feeRevenue24h ? Number(pool.feeRevenue24h) : 0;
    const apr = tvl > 0 ? (fees24h * 365 * 100) / tvl : 0;

    return {
      poolId: id,
      spotPrice,
      tvl,
      volume24h,
      fees24h,
      apr,
      reserve0: pool.reserve0,
      reserve1: pool.reserve1,
      lpCount: pool.lpCount,
    };
  }

  async updateReserves(id: string, reserve0: string, reserve1: string) {
    await this.poolRepository.update(id, { reserve0, reserve1 });
  }

  async updateTvl(id: string, tvlUsd: string) {
    await this.poolRepository.update(id, { tvlUsd });
  }
}
