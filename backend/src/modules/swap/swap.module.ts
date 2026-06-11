import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SwapService } from './swap.service';
import { SwapController } from './swap.controller';
import { SwapGateway } from './swap.gateway';
import { Swap } from '../../database/entities/swap.entity';
import { Pool } from '../../database/entities/pool.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Swap, Pool])],
  controllers: [SwapController],
  providers: [SwapService, SwapGateway],
  exports: [SwapService],
})
export class SwapModule {}
