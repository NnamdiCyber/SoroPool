const N_COINS = 2n;
const A_PRECISION = 100n;

function abs(x: bigint): bigint {
  return x < 0n ? -x : x;
}

function integerSqrt(x: bigint): bigint {
  if (x < 0n) throw new Error('NegativeInput');
  if (x === 0n) return 0n;
  let r = x;
  while (r > x / r) {
    const next = (r + x / r) / 2n;
    if (next >= r) break;
    r = next;
  }
  return r;
}

export function getD(xs: bigint[], a: bigint): bigint {
  const n = N_COINS;
  const sumX = xs.reduce((s, x) => s + x, 0n);
  if (sumX === 0n) return 0n;

  const ann = a * n ** n;
  let d = sumX;
  const precision = 1n;

  for (let i = 0; i < 256; i++) {
    let dP = d;
    for (let j = 0; j < Number(n); j++) {
      dP = (dP * d) / (xs[j] * n);
    }
    const dPrev = d;
    const numerator = (ann * sumX + dP * n) * d;
    const denominator = (ann - 1n) * d + (n + 1n) * dP;
    d = numerator / denominator;

    if (abs(d - dPrev) <= precision) {
      break;
    }
  }

  return d;
}

export function getY(
  xs: bigint[],
  a: bigint,
  d: bigint,
  i: number,
  j: number,
): bigint {
  const n = N_COINS;
  const ann = a * n ** n;

  let c = d;
  let s = 0n;

  for (let k = 0; k < Number(n); k++) {
    if (k !== i) {
      s += xs[k];
      c = (c * d) / (xs[k] * n);
    }
  }

  c = (c * d) / (ann * n);

  const b = s + d / ann;

  let yPrev = 0n;
  let y = d;

  const precision = 1n;

  for (let iter = 0; iter < 256; iter++) {
    yPrev = y;
    y = (y * y + c) / (2n * y + b - d);
    if (abs(y - yPrev) <= precision) {
      break;
    }
  }

  return y;
}

export function calculateSwap(
  i: number,
  j: number,
  dx: string,
  xs: string[],
  a: string,
  fee: number,
): { dy: string; priceImpact: number } {
  const xVals = xs.map((x) => BigInt(x));
  const dxVal = BigInt(dx);
  const aVal = BigInt(a);

  const n = N_COINS;

  const d = getD(xVals, aVal);

  xVals[i] = xVals[i] + dxVal;

  const y = getY(xVals, aVal, d, j, i);

  const initialY = BigInt(xs[j]);

  let dy = initialY - y - 1n;

  const feeAmount = (dy * BigInt(fee)) / BigInt(10_000);
  dy = dy - feeAmount;

  const priceImpact = dy > 0n ? Number((dxVal * 10_000n) / (initialY + dxVal)) / 10000 : 0;

  return {
    dy: dy.toString(),
    priceImpact,
  };
}

export function calculateTokenAmount(
  amounts: string[],
  deposits: string[],
  a: string,
  deposit: boolean,
): string {
  const aVal = BigInt(a);
  const d0 = getD(deposits.map((d) => BigInt(d)), aVal);

  const newBalances = deposits.map((d, i) => {
    const amount = BigInt(amounts[i] || '0');
    return deposit ? BigInt(d) + amount : BigInt(d) - amount;
  });

  const d1 = getD(newBalances, aVal);

  if (deposit) {
    const diff = d1 - d0;
    return diff > 0n ? diff.toString() : '0';
  } else {
    const diff = d0 - d1;
    return diff > 0n ? diff.toString() : '0';
  }
}
