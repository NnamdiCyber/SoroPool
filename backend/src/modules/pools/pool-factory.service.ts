import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PoolFactoryService {
  constructor(private readonly configService: ConfigService) {}

  async buildCreatePoolTx(params: {
    tokenA: string;
    tokenB: string;
    poolType: string;
    feeTier: number;
    amplification?: number;
  }): Promise<{ txXdr: string }> {
    const networkPassphrase = this.configService.get('stellar.networkPassphrase');
    const factoryAddress = this.configService.get('stellar.contracts.poolFactory');

    const poolTypeCode = { constant_product: 0, stableswap: 1, concentrated: 2 }[params.poolType] ?? 0;

    return {
      txXdr: `AAAAAgAAAABkZXNjcmlwdG9y...${Buffer.from(JSON.stringify({
        factoryAddress,
        method: 'create_constant_product_pool',
        args: [params.tokenA, params.tokenB, params.feeTier],
        networkPassphrase,
        poolType: poolTypeCode,
      })).toString('base64')}`,
    };
  }
}
