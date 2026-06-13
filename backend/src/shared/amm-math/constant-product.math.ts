const FEE_DENOMINATOR = 10_000n;
const MINIMUM_LIQUIDITY = 1000n;

export interface AmountResult {
  amountOut: string;
  priceImpact: number;
}

export function getAmountOut(
  amountIn: string,
  reserveIn: string,
  reserveOut: string,
  feeBps: number,
): AmountResult {
  const aIn = BigInt(amountIn);
  const rIn = BigInt(reserveIn);
  const rOut = BigInt(reserveOut);

  if (aIn <= 0n || rIn <= 0n || rOut <= 0n) {
    throw new Error('InvalidInput');
  }

  const feeMultiplier = FEE_DENOMINATOR - BigInt(feeBps);
  const amountInWithFee = aIn * feeMultiplier;
  const numerator = amountInWithFee * rOut;
  const denominator = rIn * FEE_DENOMINATOR + amountInWithFee;
  const amountOut = numerator / denominator;

  if (amountOut <= 0n) {
    throw new Error('InsufficientOutput');
  }

  const priceImpactNum = Number((aIn * 10_000n) / (rIn + aIn));
  const priceImpact = priceImpactNum / 10000;

  return { amountOut: amountOut.toString(), priceImpact };
}

export function getAmountIn(
  amountOut: string,
  reserveIn: string,
  reserveOut: string,
  feeBps: number,
): string {
  const aOut = BigInt(amountOut);
  const rIn = BigInt(reserveIn);
  const rOut = BigInt(reserveOut);

  if (aOut <= 0n || rIn <= 0n || rOut <= 0n) {
    throw new Error('InvalidInput');
  }
  if (aOut >= rOut) {
    throw new Error('InsufficientLiquidity');
  }

  const feeMultiplier = FEE_DENOMINATOR - BigInt(feeBps);
  const numerator = rIn * aOut * FEE_DENOMINATOR;
  const denominator = (rOut - aOut) * feeMultiplier;
  const amountIn = numerator / denominator + 1n;

  return amountIn.toString();
}

export function calcLpTokensMinted(
  amountA: string,
  amountB: string,
  reserveA: string,
  reserveB: string,
  totalSupply: string,
): string {
  const aA = BigInt(amountA);
  const aB = BigInt(amountB);
  const rA = BigInt(reserveA);
  const rB = BigInt(reserveB);
  const tS = BigInt(totalSupply);

  if (aA <= 0n || aB <= 0n) {
    throw new Error('InvalidInput');
  }

  if (tS === 0n) {
    const product = aA * aB;
    const sqrt = integerSqrt(product);
    const lp = sqrt - MINIMUM_LIQUIDITY;
    if (lp <= 0n) {
      throw new Error('ZeroLiquidity');
    }
    return lp.toString();
  } else {
    const lpFromA = (aA * tS) / rA;
    const lpFromB = (aB * tS) / rB;
    const lp = lpFromA < lpFromB ? lpFromA : lpFromB;
    return lp.toString();
  }
}

export function calcLpTokensBurned(
  lpAmount: string,
  totalSupply: string,
  reserveA: string,
  reserveB: string,
): { amountA: string; amountB: string } {
  const lp = BigInt(lpAmount);
  const tS = BigInt(totalSupply);
  const rA = BigInt(reserveA);
  const rB = BigInt(reserveB);

  if (tS <= 0n || lp <= 0n) {
    throw new Error('InvalidInput');
  }
  if (lp > tS) {
    throw new Error('InsufficientLiquidity');
  }

  const amountA = (lp * rA) / tS;
  const amountB = (lp * rB) / tS;

  return { amountA: amountA.toString(), amountB: amountB.toString() };
}

export function getSpotPrice(reserveA: string, reserveB: string): number {
  const rA = BigInt(reserveA);
  const rB = BigInt(reserveB);
  if (rA <= 0n) {
    throw new Error('InvalidInput');
  }
  return Number(rB) / Number(rA);
}

function integerSqrt(x: bigint): bigint {
  if (x < 0n) {
    throw new Error('NegativeInput');
  }
  if (x === 0n) {
    return 0n;
  }
  let r = x;
  while (r > x / r) {
    const next = (r + x / r) / 2n;
    if (next >= r) {
      break;
    }
    r = next;
  }
  return r;
}
