import { IsString, IsNumber, IsObject, Min } from 'class-validator';
import { IsStellarAddress } from '../../../common/decorators/is-stellar-address.decorator';
import { MinSlippage } from '../../../common/decorators/min-slippage.decorator';
import { MaxPriceImpact } from '../../../common/decorators/max-price-impact.decorator';

export class BuildSwapDto {
  @IsObject()
  quote: Record<string, unknown>;

  @IsString()
  @IsStellarAddress()
  userAddress: string;

  @IsNumber()
  @MinSlippage(0.001)
  @MaxPriceImpact(0.15)
  slippage: number;

  @IsNumber()
  @Min(1)
  deadline: number;
}
