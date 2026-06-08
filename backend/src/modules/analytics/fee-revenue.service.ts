import { Injectable } from '@nestjs/common';

@Injectable()
export class FeeRevenueService {
  async getFeeRevenue24h(poolId?: string) {
    const _ = poolId;
    return { revenueUsd: 0 };
  }

  async getProtocolFees() {
    return { totalUsd: 0 };
  }
}
