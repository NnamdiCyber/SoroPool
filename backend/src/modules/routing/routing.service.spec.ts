import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RoutingService } from './routing.service';
import { GraphService } from './graph.service';
import { RedisService } from '../../shared/redis/redis.service';
import Graph from 'graphology';

const buildMockGraph = (): Graph => {
  const g = new Graph({ multi: true });
  g.addNode('XLM');
  g.addNode('USDC');
  g.addNode('USDT');
  g.addNode('BTC');

  g.addEdge('XLM', 'USDC', {
    poolId: 'pool-1',
    poolType: 'constant_product',
    feeBps: 30,
    reserveIn: '10000000',
    reserveOut: '5000000',
    tvlUsd: 15000,
  });
  g.addEdge('USDC', 'USDT', {
    poolId: 'pool-2',
    poolType: 'stableswap',
    feeBps: 5,
    reserveIn: '5000000',
    reserveOut: '5000000',
    tvlUsd: 10000,
  });
  g.addEdge('XLM', 'USDT', {
    poolId: 'pool-3',
    poolType: 'constant_product',
    feeBps: 30,
    reserveIn: '8000000',
    reserveOut: '4000000',
    tvlUsd: 12000,
  });
  g.addEdge('BTC', 'USDC', {
    poolId: 'pool-4',
    poolType: 'constant_product',
    feeBps: 30,
    reserveIn: '100000',
    reserveOut: '5000000',
    tvlUsd: 5100000,
  });
  return g;
};

const mockGraphService = {
  getGraph: jest.fn(),
};

const mockRedisService = {
  getOrSet: jest.fn().mockImplementation((_key: string, _ttl: number, fn: () => Promise<unknown>) => fn()),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
};

describe('RoutingService', () => {
  let service: RoutingService;

  beforeEach(async () => {
    mockGraphService.getGraph.mockResolvedValue(buildMockGraph());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoutingService,
        { provide: GraphService, useValue: mockGraphService },
        { provide: RedisService, useValue: mockRedisService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'routing.maxHops') return 3;
              if (key === 'routing.maxRoutes') return 20;
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RoutingService>(RoutingService);
  });

  it('findBestRoute returns direct path for adjacent tokens', async () => {
    const route = await service.findBestRoute('XLM', 'USDC', 1_000_000n);
    expect(route).not.toBeNull();
    expect(route!.path[0]).toBe('XLM');
    expect(route!.path[route!.path.length - 1]).toBe('USDC');
    expect(BigInt(route!.amountOut)).toBeGreaterThan(0n);
  });

  it('findBestRoute finds two-hop path', async () => {
    const route = await service.findBestRoute('XLM', 'USDT', 1_000_000n, 2);
    expect(route).not.toBeNull();
    expect(route!.path.length).toBeGreaterThanOrEqual(2);
  });

  it('findBestRoute returns null for unknown tokens', async () => {
    const route = await service.findBestRoute('UNKNOWN', 'USDC', 1_000_000n);
    expect(route).toBeNull();
  });

  it('findAllPaths returns multiple paths when they exist', async () => {
    const { paths, count } = await service.findAllPaths('XLM', 'USDT', 3);
    expect(count).toBeGreaterThan(0);
    expect(paths.length).toBeGreaterThan(0);
  });

  it('simulatePath returns null for invalid reserves', async () => {
    const g = buildMockGraph();
    mockGraphService.getGraph.mockResolvedValueOnce(g);
    const result = await service.simulatePath(['XLM', 'USDC'], 0n);
    expect(result).toBeNull();
  });

  it('findAllPathsInGraph limits depth by maxHops', () => {
    const g = buildMockGraph();
    const paths = service.findAllPathsInGraph(g, 'XLM', 'USDT', 1);
    // With maxHops=1, only direct paths
    paths.forEach((p) => expect(p.length).toBeLessThanOrEqual(2));
  });
});
