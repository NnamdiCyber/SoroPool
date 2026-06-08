import { Injectable } from '@nestjs/common';

@Injectable()
export class PositionTrackerService {
  async checkRange(walletAddress: string, positionId: string) {
    const _ = { walletAddress, positionId };
    return { isInRange: true };
  }
}
