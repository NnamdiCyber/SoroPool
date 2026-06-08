import { Injectable } from '@nestjs/common';

@Injectable()
export class FarmService {
  async listFarms() {
    return [];
  }

  async getPositions(walletAddress: string) {
    const _ = walletAddress;
    return [];
  }

  async buildDepositTx(params: any) {
    const _ = params;
    return { txXdr: '' };
  }

  async buildHarvestTx(params: any) {
    const _ = params;
    return { txXdr: '' };
  }
}
