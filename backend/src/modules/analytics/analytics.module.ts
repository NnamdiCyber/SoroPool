import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TvlService } from './tvl.service';
import { VolumeService } from './volume.service';
import { FeeRevenueService } from './fee-revenue.service';
import { CandlestickService } from './candlestick.service';
import { LeaderboardService } from './leaderboard.service';
import { Pool } from '../../database/entities/pool.entity';
import { Swap } from '../../database/entities/swap.entity';
import { TvlSnapshot } from '../../database/entities/tvl-snapshot.entity';
import { PriceCandle } from '../../database/entities/price-candle.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pool, Swap, TvlSnapshot, PriceCandle])],
  providers: [
    TvlService,
    VolumeService,
    FeeRevenueService,
    CandlestickService,
    LeaderboardService,
  ],
  exports: [TvlService, VolumeService, FeeRevenueService],
})
export class AnalyticsModule {}
