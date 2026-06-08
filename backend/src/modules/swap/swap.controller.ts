import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SwapService } from './swap.service';

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
  ) {
    return this.swapService.getQuote(tokenIn, tokenOut, amountIn);
  }

  @Post('build')
  @ApiOperation({ summary: 'Build swap transaction' })
  buildSwap(@Body() body: any) {
    return this.swapService.buildSwapTransaction(
      body.quote,
      body.userAddress,
      body.slippage,
      body.deadline,
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
}
