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
    const query = this.poolRepository.createQueryBuilder('pool');
    if (filters.poolType) query.andWhere('pool.poolType = :poolType', { poolType: filters.poolType });
    if (filters.tokenA) query.andWhere('pool.token0 = :tokenA', { tokenA: filters.tokenA });
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const [data, total] = await query.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, total, page, limit };
  }

  async findById(id: string) {
    return this.poolRepository.findOne({ where: { id } });
  }

  async findByAddress(contractAddress: string) {
    return this.poolRepository.findOne({ where: { contractAddress } });
  }

  async updateReserves(id: string, reserve0: string, reserve1: string) {
    await this.poolRepository.update(id, { reserve0, reserve1 });
  }

  async updateTvl(id: string, tvlUsd: number) {
    await this.poolRepository.update(id, { tvlUsd });
  }
}
