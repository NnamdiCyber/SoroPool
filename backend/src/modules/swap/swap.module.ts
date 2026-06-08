import { Module } from '@nestjs/common';
import { SwapService } from './swap.service';
import { SwapController } from './swap.controller';
import { SwapGateway } from './swap.gateway';
import { PoolsModule } from '../pools/pools.module';

@Module({
  imports: [PoolsModule],
  controllers: [SwapController],
  providers: [SwapService, SwapGateway],
  exports: [SwapService],
})
export class SwapModule {}
