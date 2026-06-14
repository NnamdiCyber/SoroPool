import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RoutingService } from './routing.service';
import { QuoteAggregatorService } from './quote-aggregator.service';
import { GraphService } from './graph.service';

@ApiTags('routing')
@Controller('routing')
export class RoutingController {
  constructor(
    private readonly routingService: RoutingService,
    private readonly quoteAggregatorService: QuoteAggregatorService,
    private readonly graphService: GraphService,
  ) {}

  @Get('best-path')
  @ApiOperation({ summary: 'Find best swap path between two tokens' })
  async findBestPath(
    @Query('tokenIn') tokenIn: string,
    @Query('tokenOut') tokenOut: string,
    @Query('amountIn') amountIn: string,
    @Query('maxHops') maxHops?: number,
  ) {
    const hops = maxHops || 3;
    const quote = await this.quoteAggregatorService.getBestQuote(tokenIn, tokenOut, amountIn);
    if (!quote) {
      return { found: false, message: 'No route found between tokens' };
    }
    return { found: true, ...quote };
  }

  @Get('all-paths')
  @ApiOperation({ summary: 'Find all possible swap paths between two tokens' })
  async findAllPaths(
    @Query('tokenIn') tokenIn: string,
    @Query('tokenOut') tokenOut: string,
    @Query('maxHops') maxHops?: number,
  ) {
    const hops = maxHops || 3;
    return this.routingService.findAllPaths(tokenIn, tokenOut, hops);
  }

  @Get('graph-status')
  @ApiOperation({ summary: 'Get routing graph status' })
  async getGraphStatus() {
    return {
      nodes: this.graphService.getNodeCount(),
      edges: this.graphService.getEdgeCount(),
    };
  }
}
