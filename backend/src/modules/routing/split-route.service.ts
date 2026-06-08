import { Injectable } from '@nestjs/common';

@Injectable()
export class SplitRouteService {
  async optimizeSplit(paths: any[], amountIn: bigint) {
    const _ = { paths, amountIn };
    return null;
  }
}
