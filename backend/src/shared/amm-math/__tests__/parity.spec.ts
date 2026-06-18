import {
  getAmountOut,
  getAmountIn,
  calcLpTokensMinted,
  calcLpTokensBurned,
  getSpotPrice,
} from '../constant-product.math';

describe('ConstantProductMath - Parity with Rust contract', () => {
  describe('getAmountOut', () => {
    it('should compute correct amount out for standard swap', () => {
      const result = getAmountOut('1000000', '10000000', '20000000', 30);
      expect(BigInt(result.amountOut) > 0n).toBe(true);

      const expectedNumerator = BigInt(1000000) * BigInt(10000 - 30) * BigInt(20000000);
      const expectedDenominator = BigInt(10000000) * BigInt(10000) + BigInt(1000000) * BigInt(10000 - 30);
      const expectedAmountOut = expectedNumerator / expectedDenominator;
      expect(result.amountOut).toBe(expectedAmountOut.toString());
    });

    it('should apply fee correctly', () => {
      const zeroFee = getAmountOut('1000', '100000', '100000', 0);
      const withFee = getAmountOut('1000', '100000', '100000', 100);
      expect(BigInt(withFee.amountOut) < BigInt(zeroFee.amountOut)).toBe(true);
    });

    it('should reject invalid inputs', () => {
      expect(() => getAmountOut('0', '100000', '100000', 30)).toThrow();
      expect(() => getAmountOut('1000', '0', '100000', 30)).toThrow();
      expect(() => getAmountOut('1000', '100000', '0', 30)).toThrow();
    });

    it('should reject for insufficient output', () => {
      expect(() => getAmountOut('1', '10000000000', '1', 30)).toThrow();
    });

    it('should compute price impact correctly', () => {
      const result = getAmountOut('1000000', '10000000', '20000000', 30);
      expect(result.priceImpact).toBeGreaterThan(0);
      expect(result.priceImpact).toBeLessThan(1);
    });

    it('should handle large numbers without overflow', () => {
      const result = getAmountOut('1000000000000000000', '10000000000000000000', '20000000000000000000', 30);
      expect(BigInt(result.amountOut) > 0n).toBe(true);
    });
  });

  describe('getAmountIn', () => {
    it('should compute correct amount in', () => {
      const amountIn = getAmountIn('1000000', '10000000', '20000000', 30);
      expect(BigInt(amountIn) > 0n).toBe(true);
    });

    it('should reject invalid inputs', () => {
      expect(() => getAmountIn('0', '100000', '100000', 30)).toThrow();
      expect(() => getAmountIn('1000', '0', '100000', 30)).toThrow();
      expect(() => getAmountIn('1000', '100000', '0', 30)).toThrow();
    });

    it('should reject amount out exceeding reserve', () => {
      expect(() => getAmountIn('200000', '100000', '100000', 30)).toThrow('InsufficientLiquidity');
    });

    it('should round up to prevent sandwich attacks', () => {
      const input = getAmountIn('1000', '100000', '200000', 30);
      const expected = getAmountOut(input, '100000', '200000', 30);
      expect(BigInt(expected.amountOut) >= 1000n).toBe(true);
    });
  });

  describe('calcLpTokensMinted', () => {
    it('should mint sqrt product minus minimum for initial deposit', () => {
      const lp = calcLpTokensMinted('1000000', '2000000', '0', '0', '0');
      const sqrt = BigInt(Math.floor(Math.sqrt(1000000 * 2000000)));
      expect(lp).toBe((sqrt - 1000n).toString());
    });

    it('should use ratio method for subsequent deposits', () => {
      const lp = calcLpTokensMinted('1000', '500', '10000', '5000', '10000');
      expect(lp).toBe('1000');
    });

    it('should pick the smaller of the two ratios', () => {
      const lp = calcLpTokensMinted('1000', '500', '10000', '2000', '10000');
      expect(lp).toBe('1000');
    });

    it('should reject zero amounts', () => {
      expect(() => calcLpTokensMinted('0', '1000', '0', '0', '0')).toThrow();
    });

    it('should reject zero liquidity for initial deposit', () => {
      expect(() => calcLpTokensMinted('1', '1', '0', '0', '0')).toThrow();
    });
  });

  describe('calcLpTokensBurned', () => {
    it('should compute proportional token amounts', () => {
      const result = calcLpTokensBurned('1000', '10000', '50000', '100000');
      expect(result.amountA).toBe('5000');
      expect(result.amountB).toBe('10000');
    });

    it('should reject invalid inputs', () => {
      expect(() => calcLpTokensBurned('0', '10000', '50000', '100000')).toThrow();
      expect(() => calcLpTokensBurned('1000', '0', '50000', '100000')).toThrow();
    });

    it('should reject burning more than total supply', () => {
      expect(() => calcLpTokensBurned('20000', '10000', '50000', '100000')).toThrow();
    });
  });

  describe('getSpotPrice', () => {
    it('should compute spot price as reserve ratio', () => {
      const price = getSpotPrice('1000000', '2000000');
      expect(price).toBe(2);
    });

    it('should reject zero reserve', () => {
      expect(() => getSpotPrice('0', '1000000')).toThrow();
    });
  });

  describe('round-trip consistency', () => {
    it('should maintain swap consistency (out -> in -> out)', () => {
      const amountIn = '1000000';
      const reserveIn = '10000000';
      const reserveOut = '20000000';
      const feeBps = 30;

      const outResult = getAmountOut(amountIn, reserveIn, reserveOut, feeBps);
      const recoveredIn = getAmountIn(outResult.amountOut, reserveIn, reserveOut, feeBps);

      expect(BigInt(recoveredIn) >= BigInt(amountIn)).toBe(true);
    });

    it('should maintain liquidity consistency (mint -> burn)', () => {
      const lp = calcLpTokensMinted('1000000', '2000000', '10000000', '20000000', '50000');
      const result = calcLpTokensBurned(lp, '50000', '10000000', '20000000');
      expect(BigInt(result.amountA) <= 1000000n).toBe(true);
      expect(BigInt(result.amountB) <= 2000000n).toBe(true);
    });
  });

  describe('fuzz - random inputs', () => {
    function randomBigInt(min: bigint, max: bigint): bigint {
      const range = max - min + 1n;
      const bits = range.toString(2).length;
      let result = 0n;
      for (let i = 0; i < bits; i += 32) {
        result = (result << 32n) + BigInt(Math.floor(Math.random() * 4294967296));
      }
      result = result % range;
      return result + min;
    }

    const FEE_OPTIONS = [0, 1, 5, 30, 100, 300, 500, 1000];

    for (let i = 0; i < 100; i++) {
      it(`fuzz test iteration ${i}`, () => {
        const feeBps = FEE_OPTIONS[Math.floor(Math.random() * FEE_OPTIONS.length)];
        const reserveIn = randomBigInt(1000000n, 1000000000000n);
        const reserveOut = randomBigInt(1000000n, 1000000000000n);
        const amountIn = randomBigInt(1n, reserveIn / 2n);

        const result = getAmountOut(amountIn.toString(), reserveIn.toString(), reserveOut.toString(), feeBps);
        expect(BigInt(result.amountOut) > 0n).toBe(true);
        expect(BigInt(result.amountOut) < reserveOut).toBe(true);

        const priceImpact = result.priceImpact;
        expect(priceImpact >= 0).toBe(true);
        expect(priceImpact <= 1).toBe(true);
      });
    }
  });
});

describe('StableSwap Math - Parity with Rust contract', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getD, getY, calculateSwap, calculateTokenAmount } = require('../stable-swap.math');

  describe('getD', () => {
    it('should compute D for equal balances', () => {
      const xs = [BigInt('1000000'), BigInt('1000000')];
      const d = getD(xs, 100n * 100n);
      expect(d > 0n).toBe(true);
      expect(d <= 2000000n * 2n).toBe(true);
    });

    it('should return 0 for zero balances', () => {
      expect(getD([0n, 0n], 100n * 100n)).toBe(0n);
    });

    it('should converge to sum for very large A', () => {
      const xs = [BigInt('1000000'), BigInt('2000000')];
      const d = getD(xs, 1000000n * 100n);
      const sum = xs[0] + xs[1];
      expect(Math.abs(Number(d) - Number(sum)) / Number(sum)).toBeLessThan(0.1);
    });
  });

  describe('calculateSwap', () => {
    it('should compute swap between two tokens', () => {
      const xs = ['1000000', '1000000'];
      const result = calculateSwap(0, 1, '100000', xs, String(100n * 100n), 0);
      expect(BigInt(result.dy) > 0n).toBe(true);
      expect(BigInt(result.dy) < 100000n).toBe(true);
    });

    it('should apply fee', () => {
      const xs = ['1000000', '1000000'];
      const result = calculateSwap(0, 1, '100000', xs, String(100n * 100n), 100);
      expect(BigInt(result.dy) > 0n).toBe(true);
    });
  });
});

describe('Concentrated Liquidity Math - Parity with Rust contract', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const {
    tickToPrice,
    getAmount0Delta,
    getAmount1Delta,
  } = require('../concentrated.math');

  describe('tickToPrice', () => {
    it('should return Q64.96 price for tick 0', () => {
      const price = tickToPrice(0);
      expect(price).toBe(1n << 96n);
    });

    it('should return price < Q96 for negative ticks', () => {
      const price = tickToPrice(-1);
      expect(price < (1n << 96n)).toBe(true);
    });

    it('should return price > Q96 for positive ticks', () => {
      const price = tickToPrice(1);
      expect(price > (1n << 96n)).toBe(true);
    });

    it('should handle min tick', () => {
      const price = tickToPrice(-887272);
      expect(price > 0n).toBe(true);
    });
  });

  describe('getAmount0Delta', () => {
    it('should compute token0 amount for a price range', () => {
      const sqrtA = tickToPrice(0);
      const sqrtB = tickToPrice(100);
      const liquidity = 1000000n;
      const amount0 = getAmount0Delta(sqrtA, sqrtB, liquidity, false);
      expect(amount0 > 0n).toBe(true);
    });

    it('should handle equal prices (zero delta)', () => {
      const sqrtA = tickToPrice(0);
      const amount0 = getAmount0Delta(sqrtA, sqrtA, 1000000n, false);
      expect(amount0).toBe(0n);
    });

    it('should round up when requested', () => {
      const sqrtA = tickToPrice(0);
      const sqrtB = tickToPrice(1);
      const liquidity = 1000000n;
      const amountDown = getAmount0Delta(sqrtA, sqrtB, liquidity, false);
      const amountUp = getAmount0Delta(sqrtA, sqrtB, liquidity, true);
      expect(amountUp >= amountDown).toBe(true);
    });
  });

  describe('getAmount1Delta', () => {
    it('should compute token1 amount for a price range', () => {
      const sqrtA = tickToPrice(0);
      const sqrtB = tickToPrice(100);
      const liquidity = 1000000n;
      const amount1 = getAmount1Delta(sqrtA, sqrtB, liquidity, false);
      expect(amount1 > 0n).toBe(true);
    });

    it('should handle equal prices (zero delta)', () => {
      const sqrtA = tickToPrice(0);
      const amount1 = getAmount1Delta(sqrtA, sqrtA, 1000000n, false);
      expect(amount1).toBe(0n);
    });
  });
});
