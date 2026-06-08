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
    const _ = params;
    return { txXdr: '' };
  }
}
