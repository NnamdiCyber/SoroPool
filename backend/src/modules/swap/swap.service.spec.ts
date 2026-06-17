import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { SwapService } from './swap.service';
import { Swap } from '../../database/entities/swap.entity';
import { Pool } from '../../database/entities/pool.entity';

const mockPool = {
  id: 'pool-1',
  poolType: 'constant_product',
  feeBps: 30,
  reserve0: '10000000',
  reserve1: '5000000',
  token0: { symbol: 'XLM' },
  token1: { symbol: 'USDC' },
  token0Id: 'tok-xlm',
  token1Id: 'tok-usdc',
  isActive: true,
};

const swapRepository = {
  find: jest.fn().mockResolvedValue([]),
  save: jest.fn().mockImplementation((s: any) => Promise.resolve({ ...s, id: 'swap-1' })),
  createQueryBuilder: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ volume: '50000' }),
  }),
};

const poolRepository = {
  findOne: jest.fn(),
};

describe('SwapService', () => {
  let service: SwapService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SwapService,
        { provide: getRepositoryToken(Swap), useValue: swapRepository },
        { provide: getRepositoryToken(Pool), useValue: poolRepository },
      ],
    }).compile();

    service = module.get<SwapService>(SwapService);
  });

  afterEach(() => jest.clearAllMocks());

  it('getQuote returns valid quote for constant-product pool', async () => {
    poolRepository.findOne.mockResolvedValueOnce(mockPool);
    const quote = await service.getQuote('XLM', 'USDC', '1000000');
    expect(quote.amountIn).toBe('1000000');
    expect(Number(quote.amountOut)).toBeGreaterThan(0);
    expect(quote.priceImpact).toBeGreaterThanOrEqual(0);
    expect(quote.route.pools.length).toBe(1);
    expect(['low', 'medium', 'high', 'critical']).toContain(quote.priceImpactSeverity);
  });

  it('getQuote throws NotFoundException when no pool found', async () => {
    poolRepository.findOne.mockResolvedValueOnce(null);
    await expect(service.getQuote('XLM', 'USDC', '1000000')).rejects.toThrow(NotFoundException);
  });

  it('getQuote respects direction via token0 symbol match', async () => {
    poolRepository.findOne.mockResolvedValueOnce(mockPool);
    const quote = await service.getQuote('USDC', 'XLM', '500000', 'pool-1');
    expect(Number(quote.amountOut)).toBeGreaterThan(0);
    expect(quote.effectivePrice).toBeGreaterThan(0);
  });

  it('buildSwapTransaction returns XDR stub with minAmountOut', async () => {
    const quote = { amountOut: '490000' };
    const result = await service.buildSwapTransaction(quote, 'GADDR...', 0.005, 30);
    expect(result.txXdr).toBeTruthy();
    expect(Number(result.minAmountOut)).toBeLessThanOrEqual(490000);
  });

  it('recordSwap persists swap record', async () => {
    const result = await service.recordSwap({
      poolId: 'pool-1',
      walletAddress: 'GADDR',
      tokenInId: 'tok-xlm',
      tokenOutId: 'tok-usdc',
      amountIn: '1000',
      amountOut: '500',
      txHash: 'abc123',
    });
    expect(swapRepository.save).toHaveBeenCalled();
    expect(result.txHash).toBe('abc123');
  });

  it('getVolume24h returns aggregated volume', async () => {
    const vol = await service.getVolume24h('pool-1');
    expect(vol).toBe('50000');
  });
});
