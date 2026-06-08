import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiquidityService } from './liquidity.service';
import { IlCalculatorService } from './il-calculator.service';
import { PositionTrackerService } from './position-tracker.service';
import { LpPosition } from '../../database/entities/lp-position.entity';
import { ClPosition } from '../../database/entities/cl-position.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LpPosition, ClPosition])],
  providers: [LiquidityService, IlCalculatorService, PositionTrackerService],
  exports: [LiquidityService],
})
export class LiquidityModule {}
