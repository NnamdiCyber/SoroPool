import { IsString, IsNumber, IsOptional, IsIn, Min } from 'class-validator';
import { IsStellarAddress } from '../../../common/decorators/is-stellar-address.decorator';

export class CreatePoolDto {
  @IsString()
  @IsStellarAddress()
  tokenA: string;

  @IsString()
  @IsStellarAddress()
  tokenB: string;

  @IsString()
  @IsIn(['constant_product', 'stableswap', 'concentrated'])
  poolType: string;

  @IsNumber()
  @Min(1)
  feeTier: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  amplification?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  tickSpacing?: number;

  @IsOptional()
  @IsString()
  initialSqrtPrice?: string;
}
