import { Injectable } from '@nestjs/common';

@Injectable()
export class IlCalculatorService {
  calculateImpermanentLoss(priceEntry: number, priceCurrent: number) {
    const priceRatio = priceCurrent / priceEntry;
    const ilFactor = (2 * Math.sqrt(priceRatio)) / (1 + priceRatio) - 1;
    return {
      ilPercent: ilFactor * 100,
      ilUsd: 0,
      hodlValue: 0,
      lpValue: 0,
    };
  }

  calculateConcentratedIL(
    tickLower: number,
    tickUpper: number,
    priceEntry: number,
    priceCurrent: number,
  ) {
    const _ = { tickLower, tickUpper, priceEntry, priceCurrent };
    return 0;
  }

  private tickToPrice(tick: number): number {
    return Math.pow(1.0001, tick);
  }
}
