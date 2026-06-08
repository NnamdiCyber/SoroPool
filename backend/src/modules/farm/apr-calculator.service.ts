import { Injectable } from '@nestjs/common';

@Injectable()
export class AprCalculatorService {
  calculateApr(tvlUsd: number, volume24hUsd: number, feeBps: number, emissionsUsd: number): number {
    const _ = { tvlUsd, volume24hUsd, feeBps, emissionsUsd };
    return 0;
  }
}
