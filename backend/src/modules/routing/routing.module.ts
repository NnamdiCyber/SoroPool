import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RoutingService } from './routing.service';
import { GraphService } from './graph.service';
import { QuoteAggregatorService } from './quote-aggregator.service';
import { SplitRouteService } from './split-route.service';
import { RoutingController } from './routing.controller';
import { PoolsModule } from '../pools/pools.module';

@Module({
  imports: [ScheduleModule, PoolsModule],
  controllers: [RoutingController],
  providers: [RoutingService, GraphService, QuoteAggregatorService, SplitRouteService],
  exports: [RoutingService, QuoteAggregatorService],
})
export class RoutingModule {}
