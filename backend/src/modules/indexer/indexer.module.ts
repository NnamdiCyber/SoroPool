import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { StellarIndexerService } from './stellar-indexer.service';
import { EventProcessorService } from './event-processor.service';
import { SwapIndexerService } from './swap-indexer.service';
import { LiquidityIndexerService } from './liquidity-indexer.service';
import { Swap } from '../../database/entities/swap.entity';
import { Pool } from '../../database/entities/pool.entity';
import { LpPosition } from '../../database/entities/lp-position.entity';
import { ClPosition } from '../../database/entities/cl-position.entity';
import { PoolsModule } from '../pools/pools.module';

@Module({
  imports: [
    ScheduleModule,
    TypeOrmModule.forFeature([Swap, Pool, LpPosition, ClPosition]),
    PoolsModule,
  ],
  providers: [
    StellarIndexerService,
    EventProcessorService,
    SwapIndexerService,
    LiquidityIndexerService,
  ],
})
export class IndexerModule {}
