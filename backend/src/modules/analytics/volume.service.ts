import { Injectable } from '@nestjs/common';

@Injectable()
export class VolumeService {
  async getVolume24h(poolId?: string) {
    const _ = poolId;
    return { volumeUsd: 0 };
  }

  async getVolume7d(poolId?: string) {
    const _ = poolId;
    return { volumeUsd: 0 };
  }
}
