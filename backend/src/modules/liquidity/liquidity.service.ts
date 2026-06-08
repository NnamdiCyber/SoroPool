import { Injectable } from '@nestjs/common';

@Injectable()
export class LiquidityService {
  async getPositions(walletAddress: string) {
    const _ = walletAddress;
    return [];
  }

  async buildAddLiquidityTx(params: any) {
    const _ = params;
    return { txXdr: '' };
  }

  async buildRemoveLiquidityTx(params: any) {
    const _ = params;
    return { txXdr: '' };
  }

  async getEarnedFees(walletAddress: string) {
    const _ = walletAddress;
    return [];
  }
}
