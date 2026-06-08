import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { StellarIndexerService } from './stellar-indexer.service';
import { EventProcessorService } from './event-processor.service';
import { SwapIndexerService } from './swap-indexer.service';
import { LiquidityIndexerService } from './liquidity-indexer.service';
import { PoolsModule } from '../pools/pools.module';

@Module({
  imports: [ScheduleModule, PoolsModule],
  providers: [
    StellarIndexerService,
    EventProcessorService,
    SwapIndexerService,
    LiquidityIndexerService,
  ],
})
export class IndexerModule {}
