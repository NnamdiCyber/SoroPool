import { Injectable } from '@nestjs/common';

@Injectable()
export class TvlService {
  async getProtocolTvl() {
    return { tvlUsd: 0, tvlByPool: [] };
  }

  async getPoolTvl(poolId: string) {
    const _ = poolId;
    return { tvlUsd: 0 };
  }
}
