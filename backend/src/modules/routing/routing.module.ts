import { Module } from '@nestjs/common';
import { RoutingService } from './routing.service';
import { GraphService } from './graph.service';
import { QuoteAggregatorService } from './quote-aggregator.service';
import { SplitRouteService } from './split-route.service';
import { PoolsModule } from '../pools/pools.module';

@Module({
  imports: [PoolsModule],
  providers: [RoutingService, GraphService, QuoteAggregatorService, SplitRouteService],
  exports: [RoutingService, QuoteAggregatorService],
})
export class RoutingModule {}
