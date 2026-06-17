import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PoolsService } from './pools.service';
import { Pool } from '../../database/entities/pool.entity';

const mockPool = {
  id: 'pool-1',
  contractAddress: 'CPOOL123',
  poolType: 'constant_product',
  feeBps: 30,
  reserve0: '1000000',
  reserve1: '500000',
  tvlUsd: '1500',
  volume24hUsd: '50000',
  feeRevenue24h: '150',
  lpCount: 5,
  isActive: true,
  token0: { symbol: 'XLM' },
  token1: { symbol: 'USDC' },
};

const mockRepository = {
  createQueryBuilder: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue([[mockPool], 1]),
  findOne: jest.fn(),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
  where: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([mockPool]),
};

describe('PoolsService', () => {
  let service: PoolsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoolsService,
        { provide: getRepositoryToken(Pool), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<PoolsService>(PoolsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('findAll returns paginated pools', async () => {
    const result = await service.findAll({}, { page: 1, limit: 20 });
    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.page).toBe(1);
  });

  it('findById returns pool when found', async () => {
    mockRepository.findOne.mockResolvedValueOnce(mockPool);
    const pool = await service.findById('pool-1');
    expect(pool.id).toBe('pool-1');
  });

  it('findById throws NotFoundException when not found', async () => {
    mockRepository.findOne.mockResolvedValueOnce(null);
    await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
  });

  it('getPoolStats returns computed APR and spot price', async () => {
    mockRepository.findOne.mockResolvedValueOnce(mockPool);
    const stats = await service.getPoolStats('pool-1');
    expect(stats.poolId).toBe('pool-1');
    expect(stats.spotPrice).toBeCloseTo(0.5);
    expect(stats.apr).toBeGreaterThan(0);
  });

  it('updateReserves calls repository update', async () => {
    await service.updateReserves('pool-1', '2000000', '1000000');
    expect(mockRepository.update).toHaveBeenCalledWith('pool-1', {
      reserve0: '2000000',
      reserve1: '1000000',
    });
  });
});
