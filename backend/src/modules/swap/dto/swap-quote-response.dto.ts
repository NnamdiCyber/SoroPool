import { IsString, IsNumber, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { IsBigIntString } from '../../../common/decorators/is-bigint-string.decorator';

export class PoolHopDto {
  @IsString()
  poolId: string;

  @IsString()
  poolType: string;

  @IsString()
  tokenIn: string;

  @IsString()
  tokenOut: string;

  @IsBigIntString()
  amountIn: string;

  @IsBigIntString()
  amountOut: string;

  @IsNumber()
  priceImpact: number;

  @IsNumber()
  fee: number;
}

export class SwapRouteDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PoolHopDto)
  pools: PoolHopDto[];

  @IsArray()
  @IsString({ each: true })
  path: string[];

  @IsNumber()
  totalPriceImpact: number;
}

export class SwapQuoteResponseDto {
  @IsString()
  tokenIn: string;

  @IsString()
  tokenOut: string;

  @IsBigIntString()
  amountIn: string;

  @IsBigIntString()
  amountOut: string;

  @IsNumber()
  priceImpact: number;

  @ValidateNested()
  @Type(() => SwapRouteDto)
  route: SwapRouteDto;

  @IsNumber()
  effectivePrice: number;

  @IsBigIntString()
  fee: string;

  @IsOptional()
  @IsNumber()
  priceImpactSeverity?: 'low' | 'medium' | 'high' | 'critical';
}
