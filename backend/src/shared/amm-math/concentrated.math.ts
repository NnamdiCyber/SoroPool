const Q96 = 1n << 96n;
const Q128 = 1n << 128n;
const MAX_U256 = (1n << 256n) - 1n;
const MIN_TICK = -887272;
const MAX_TICK = 887272;

function abs(x: bigint): bigint {
  return x < 0n ? -x : x;
}

function mulDiv(a: bigint, b: bigint, denominator: bigint): bigint {
  return (a * b) / denominator;
}

function mulDivRoundingUp(a: bigint, b: bigint, denominator: bigint): bigint {
  const product = a * b;
  return (product + denominator - 1n) / denominator;
}

export function tickToPrice(tick: number): bigint {
  if (tick < MIN_TICK || tick > MAX_TICK) {
    throw new Error('InvalidTick');
  }

  const absTick = tick < 0 ? -tick : tick;

  let ratio = (absTick & 1) !== 0
    ? BigInt('0xfffcb933bd6fb4df') << 64n
    : Q128;

  if ((absTick & 2) !== 0) {
    ratio = (ratio * (BigInt('0xfff97272373d41a9') << 64n)) >> 128n;
  }
  if ((absTick & 4) !== 0) {
    ratio = (ratio * (BigInt('0xfff2e50f5f6567d4') << 64n)) >> 128n;
  }
  if ((absTick & 8) !== 0) {
    ratio = (ratio * (BigInt('0xffe5caca7e10e4e4') << 64n)) >> 128n;
  }
  if ((absTick & 16) !== 0) {
    ratio = (ratio * (BigInt('0xffcb9843d60f6159') << 64n)) >> 128n;
  }
  if ((absTick & 32) !== 0) {
    ratio = (ratio * (BigInt('0xff973b41fa98c081') << 64n)) >> 128n;
  }
  if ((absTick & 64) !== 0) {
    ratio = (ratio * (BigInt('0xff2ea16466c96a88') << 64n)) >> 128n;
  }
  if ((absTick & 128) !== 0) {
    ratio = (ratio * (BigInt('0xfe5dee046a99a2a8') << 64n)) >> 128n;
  }
  if ((absTick & 256) !== 0) {
    ratio = (ratio * (BigInt('0xfcbe86c7900a07a3') << 64n)) >> 128n;
  }
  if ((absTick & 512) !== 0) {
    ratio = (ratio * (BigInt('0xf987a7253ac5d183') << 64n)) >> 128n;
  }
  if ((absTick & 1024) !== 0) {
    ratio = (ratio * (BigInt('0xf3392b0822b70106') << 64n)) >> 128n;
  }
  if ((absTick & 2048) !== 0) {
    ratio = (ratio * (BigInt('0xe7159475a2c29b76') << 64n)) >> 128n;
  }
  if ((absTick & 4096) !== 0) {
    ratio = (ratio * (BigInt('0xd097f3bdfd2022c5') << 64n)) >> 128n;
  }
  if ((absTick & 8192) !== 0) {
    ratio = (ratio * (BigInt('0xa9f746462d70f7fe') << 64n)) >> 128n;
  }
  if ((absTick & 16384) !== 0) {
    ratio = (ratio * (BigInt('0x70d869a156d29aa3') << 64n)) >> 128n;
  }
  if ((absTick & 32768) !== 0) {
    ratio = (ratio * (BigInt('0x31be135f97d32081') << 64n)) >> 128n;
  }
  if ((absTick & 65536) !== 0) {
    ratio = (ratio * (BigInt('0x9aa508b5b7a5a10f') << 64n)) >> 128n;
  }
  if ((absTick & 131072) !== 0) {
    ratio = (ratio * (BigInt('0x5d6af8dedb811966') << 64n)) >> 128n;
  }
  if ((absTick & 262144) !== 0) {
    ratio = (ratio * (BigInt('0x2216e584f5fa1ebd') << 64n)) >> 128n;
  }
  if ((absTick & 524288) !== 0) {
    ratio = (ratio * (BigInt('0x48a170392f514d3f') << 64n)) >> 128n;
  }

  if (tick > 0) {
    ratio = MAX_U256 / ratio;
  }

  return ratio >> 32n;
}

export function priceToTick(sqrtPriceX96: bigint): number {
  if (sqrtPriceX96 <= 0n) {
    throw new Error('InvalidPrice');
  }

  let tick = 0;
  let price = sqrtPriceX96;

  while (price > BigInt('0x100000000000000000000000000000000')) {
    price = price >> 1n;
    tick += 1;
  }
  while (price < BigInt('0x100000000000000000000000000000000')) {
    price = price << 1n;
    tick -= 1;
  }

  let msb = 0;
  let p = price;
  while (p > 1n) {
    p = p >> 1n;
    msb++;
  }

  const log2 = BigInt(msb - 96) * Q96;
  return Number(log2 >> 96n);
}

export function getAmount0Delta(
  sqrtRatioA: bigint,
  sqrtRatioB: bigint,
  liquidity: bigint,
  roundUp: boolean,
): bigint {
  if (sqrtRatioA > sqrtRatioB) {
    [sqrtRatioA, sqrtRatioB] = [sqrtRatioB, sqrtRatioA];
  }

  const diff = sqrtRatioB - sqrtRatioA;
  const numerator = liquidity * diff;

  if (roundUp) {
    return mulDivRoundingUp(numerator, Q96, sqrtRatioB * sqrtRatioA);
  }
  return mulDiv(numerator, Q96, sqrtRatioB * sqrtRatioA);
}

export function getAmount1Delta(
  sqrtRatioA: bigint,
  sqrtRatioB: bigint,
  liquidity: bigint,
  roundUp: boolean,
): bigint {
  if (sqrtRatioA > sqrtRatioB) {
    [sqrtRatioA, sqrtRatioB] = [sqrtRatioB, sqrtRatioA];
  }

  const diff = sqrtRatioB - sqrtRatioA;

  if (roundUp) {
    return mulDivRoundingUp(liquidity, diff, Q96);
  }
  return mulDiv(liquidity, diff, Q96);
}

export function getNextSqrtPriceFromInput(
  sqrtP: bigint,
  liquidity: bigint,
  amountIn: bigint,
  zeroForOne: boolean,
): bigint {
  if (sqrtP <= 0n || liquidity <= 0n) {
    throw new Error('InvalidInput');
  }

  if (zeroForOne) {
    const numerator = liquidity * sqrtP;
    const denominator = liquidity + amountIn * sqrtP / Q96;
    if (denominator <= 0n) {
      throw new Error('ZeroLiquidity');
    }
    const sqrtPNext = numerator / denominator;
    if (sqrtPNext < 1n) {
      throw new Error('PriceTooLow');
    }
    return sqrtPNext;
  } else {
    const numerator = liquidity * Q96 + amountIn * sqrtP;
    const sqrtPNext = sqrtP + (numerator - liquidity * Q96) / liquidity;
    return sqrtP + (amountIn * Q96) / liquidity;
  }
}

export interface SwapStepResult {
  sqrtPNext: bigint;
  amountIn: bigint;
  amountOut: bigint;
  feeAmount: bigint;
}

export function computeSwapStep(
  sqrtP: bigint,
  sqrtPTarget: bigint,
  liquidity: bigint,
  amountIn: bigint,
  feeBps: number,
): SwapStepResult {
  const zeroForOne = sqrtP >= sqrtPTarget;

  const fee = (amountIn * BigInt(feeBps)) / 10000n;
  const amountInAfterFee = amountIn - fee;

  const maxAmountIn = zeroForOne
    ? getAmount0Delta(sqrtPTarget, sqrtP, liquidity, false)
    : getAmount1Delta(sqrtP, sqrtPTarget, liquidity, false);

  let sqrtPNext: bigint;
  let amountInUsed: bigint;

  if (amountInAfterFee >= maxAmountIn) {
    sqrtPNext = sqrtPTarget;
    amountInUsed = maxAmountIn;
  } else {
    sqrtPNext = getNextSqrtPriceFromInput(sqrtP, liquidity, amountInAfterFee, zeroForOne);
    amountInUsed = amountInAfterFee;
  }

  const amountOut = zeroForOne
    ? getAmount1Delta(sqrtPNext, sqrtP, liquidity, false)
    : getAmount0Delta(sqrtP, sqrtPNext, liquidity, false);

  return {
    sqrtPNext,
    amountIn: amountInUsed,
    amountOut,
    feeAmount: fee,
  };
}
