import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AmmMathService {
  getAmountOut(
    amountIn: bigint,
    reserveIn: bigint,
    reserveOut: bigint,
    feeBps: bigint = 30n,
  ): { amountOut: bigint; priceImpact: number } {
    const FEE_DENOMINATOR = 10000n;
    const amountInWithFee = amountIn * (FEE_DENOMINATOR - feeBps);
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn * FEE_DENOMINATOR + amountInWithFee;
    const amountOut = numerator / denominator;

    const spotPrice = Number(reserveOut) / Number(reserveIn);
    const executionPrice = Number(amountOut) / Number(amountIn);
    const priceImpact = Math.abs(1 - executionPrice / spotPrice);

    return { amountOut, priceImpact };
  }

  getAmountIn(
    amountOut: bigint,
    reserveIn: bigint,
    reserveOut: bigint,
    feeBps: bigint = 30n,
  ): bigint {
    const FEE_DENOMINATOR = 10000n;
    const numerator = reserveIn * amountOut * FEE_DENOMINATOR;
    const denominator = (reserveOut - amountOut) * (FEE_DENOMINATOR - feeBps);
    return numerator / denominator + 1n;
  }

  calcLpTokensMinted(
    amountA: bigint,
    amountB: bigint,
    reserveA: bigint,
    reserveB: bigint,
    totalSupply: bigint,
  ): bigint {
    if (totalSupply === 0n) {
      const sqrt = (x: bigint): bigint => {
        if (x === 0n) return 0n;
        let r = x;
        while (r > x / r) r = (r + x / r) / 2n;
        return r;
      };
      return sqrt(amountA * amountB) - 1000n;
    }
    const lpFromA = (amountA * totalSupply) / reserveA;
    const lpFromB = (amountB * totalSupply) / reserveB;
    return lpFromA < lpFromB ? lpFromA : lpFromB;
  }
}
