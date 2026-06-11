import { Injectable } from '@nestjs/common';
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
    if (filters.tokenA) query.andWhere('pool.token0 = :tokenA', { tokenA: filters.tokenA });
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const [data, total] = await query.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, total, page, limit };
  }

  async findById(id: string) {
    return this.poolRepository.findOne({ where: { id }, relations: ['token0', 'token1'] });
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

  async updateReserves(id: string, reserve0: string, reserve1: string) {
    await this.poolRepository.update(id, { reserve0, reserve1 });
  }

  async updateTvl(id: string, tvlUsd: string) {
    await this.poolRepository.update(id, { tvlUsd });
  }
}
