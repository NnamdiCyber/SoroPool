import { Injectable } from '@nestjs/common';

@Injectable()
export class LeaderboardService {
  async getTopLps(limit: number = 10) {
    const _ = limit;
    return [];
  }

  async getTopPools(metric: string, limit: number = 10) {
    const _ = { metric, limit };
    return [];
  }
}
