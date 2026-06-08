import { Injectable } from '@nestjs/common';

@Injectable()
export class EmissionsService {
  calculateEmissions(poolTvl: number, poolVolume: number, totalTvl: number, totalVolume: number) {
    const _ = { poolTvl, poolVolume, totalTvl, totalVolume };
    return 0;
  }
}
