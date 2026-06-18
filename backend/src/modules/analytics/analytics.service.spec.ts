import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TvlService } from './tvl.service';
import { Pool } from '../../database/entities/pool.entity';
import { TvlSnapshot } from '../../database/entities/tvl-snapshot.entity';

const mockPools = [
  { id: 'pool-1', reserve0: '10000000', reserve1: '5000000', isActive: true },
  { id: 'pool-2', reserve0: '20000000', reserve1: '20000000', isActive: true },
];

const mockSnapshot = {
  time: new Date(),
  poolId: 'pool-1',
  tvlUsd: '15000',
  reserve0: '10000000',
  reserve1: '5000000',
};

const poolRepository = {
  find: jest.fn().mockResolvedValue(mockPools),
  findOne: jest.fn().mockResolvedValue(mockPools[0]),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
};

const tvlSnapshotRepository = {
  find: jest.fn().mockResolvedValue([mockSnapshot]),
  save: jest.fn().mockResolvedValue(mockSnapshot),
};

describe('TvlService', () => {
  let service: TvlService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TvlService,
        { provide: getRepositoryToken(Pool), useValue: poolRepository },
        { provide: getRepositoryToken(TvlSnapshot), useValue: tvlSnapshotRepository },
      ],
    }).compile();

    service = module.get<TvlService>(TvlService);
  });

  it('getProtocolTvl returns total TVL sum across pools', async () => {
    const result = await service.getProtocolTvl();
    expect(result.tvlUsd).toBeGreaterThan(0);
    expect(result.tvlByPool).toHaveLength(2);
  });

  it('getPoolTvl returns zero for pool with no reserves', async () => {
    poolRepository.findOne.mockResolvedValueOnce({ id: 'pool-3', reserve0: '0', reserve1: '0' });
    const result = await service.getPoolTvl('pool-3');
    expect(result.tvlUsd).toBe(0);
  });

  it('getTvlHistory returns snapshots', async () => {
    const snapshots = await service.getTvlHistory('pool-1');
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].tvlUsd).toBe('15000');
  });
});

// Volume & fee revenue aggregation tests
import { VolumeService } from './volume.service';
import { FeeRevenueService } from './fee-revenue.service';
import { Swap } from '../../database/entities/swap.entity';

import { Pool } from '../../database/entities/pool.entity';

const swapQB = {
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getRawOne: jest.fn().mockResolvedValue({ volume: '100000', fees: '300' }),
};
const swapRepository = {
  createQueryBuilder: jest.fn().mockReturnValue(swapQB),
};

describe('VolumeService', () => {
  let service: VolumeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VolumeService,
        { provide: getRepositoryToken(Swap), useValue: swapRepository },
      ],
    }).compile();
    service = module.get<VolumeService>(VolumeService);
  });

  it('getVolume24h returns raw aggregated value', async () => {
    const result = await service.getVolume24h();
    expect(result.volumeUsd).toBeGreaterThanOrEqual(0);
  });
});

describe('FeeRevenueService', () => {
  let service: FeeRevenueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeeRevenueService,
        { provide: getRepositoryToken(Swap), useValue: swapRepository },
        { provide: getRepositoryToken(Pool), useValue: { find: jest.fn().mockResolvedValue([]) } },
      ],
    }).compile();
    service = module.get<FeeRevenueService>(FeeRevenueService);
  });

  it('getFeeRevenue24h returns aggregated fees', async () => {
    const result = await service.getFeeRevenue24h();
    expect(result.revenueUsd).toBeGreaterThanOrEqual(0);
  });
});
