import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SwapService } from './swap.service';
import { BuildSwapDto } from './dto/build-swap.dto';

@ApiTags('swap')
@Controller('swap')
export class SwapController {
  constructor(private readonly swapService: SwapService) {}

  @Get('quote')
  @ApiOperation({ summary: 'Get swap quote with route' })
  getQuote(
    @Query('tokenIn') tokenIn: string,
    @Query('tokenOut') tokenOut: string,
    @Query('amountIn') amountIn: string,
    @Query('poolId') poolId?: string,
  ) {
    return this.swapService.getQuote(tokenIn, tokenOut, amountIn, poolId);
  }

  @Post('build')
  @ApiOperation({ summary: 'Build swap transaction' })
  buildSwap(@Body() buildSwapDto: BuildSwapDto) {
    return this.swapService.buildSwapTransaction(
      buildSwapDto.quote,
      buildSwapDto.userAddress,
      buildSwapDto.slippage,
      buildSwapDto.deadline,
    );
  }

  @Get('price-impact')
  @ApiOperation({ summary: 'Calculate price impact' })
  calculatePriceImpact(
    @Query('amountIn') amountIn: string,
    @Query('reserveIn') reserveIn: string,
    @Query('reserveOut') reserveOut: string,
  ) {
    return this.swapService.calculatePriceImpact(amountIn, reserveIn, reserveOut);
  }

  @Get('spot-price')
  @ApiOperation({ summary: 'Get spot price for a pool' })
  getSpotPrice(@Query('poolId') poolId: string) {
    return this.swapService.getSpotPrice(poolId);
  }
}
