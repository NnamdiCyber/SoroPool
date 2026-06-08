import { Injectable } from '@nestjs/common';

@Injectable()
export class RangeAlertService {
  async checkAndAlert(walletAddress: string, positionId: string) {
    const _ = { walletAddress, positionId };
    return { outOfRange: false };
  }
}
