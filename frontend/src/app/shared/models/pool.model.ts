export type PoolType = 'constant_product' | 'stableswap' | 'concentrated';

export interface TokenInfo {
  symbol: string;
  name: string;
  contractAddress: string;
  decimals: number;
  logoUrl?: string;
  isVerified?: boolean;
}

export interface PoolInfo {
  id: string;
  contractAddress: string;
  poolType: PoolType;
  token0: TokenInfo;
  token1: TokenInfo;
  feeBps: number;
  tickSpacing?: number;
  amplification?: number;
  reserve0: string;
  reserve1: string;
  sqrtPriceX96?: string;
  currentTick?: number;
  tvlUsd: string;
  volume24hUsd: string;
  feeRevenue24h: string;
  lpCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SwapQuote {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  priceImpact: number;
  fee: string;
  effectivePrice: string;
  route: SwapRoute | null;
}

export interface SwapRoute {
  pools: PoolHop[];
  path: string[];
  totalPriceImpact: number;
}

export interface PoolHop {
  poolId: string;
  poolType: PoolType;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  priceImpact: number;
  fee: number;
}

export interface LpPosition {
  id: string;
  walletAddress: string;
  pool: PoolInfo;
  lpTokenAmount: string;
  token0Deposited: string;
  token1Deposited: string;
  token0PriceAtEntry: string;
  feesEarnedToken0: string;
  feesEarnedToken1: string;
  createdAt: string;
}

export interface ClPosition {
  id: string;
  positionId: number;
  walletAddress: string;
  pool: PoolInfo;
  tickLower: number;
  tickUpper: number;
  liquidity: string;
  token0Owed: string;
  token1Owed: string;
  isInRange: boolean;
}
