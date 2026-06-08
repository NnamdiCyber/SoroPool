import { Injectable } from '@nestjs/common';

@Injectable()
export class LiquidityIndexerService {
  async indexMint(event: any) {
    const _ = event;
    return null;
  }

  async indexBurn(event: any) {
    const _ = event;
    return null;
  }
}
