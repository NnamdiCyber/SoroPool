import { Module } from '@nestjs/common';
import { FarmService } from './farm.service';
import { EmissionsService } from './emissions.service';
import { AprCalculatorService } from './apr-calculator.service';

@Module({
  providers: [FarmService, EmissionsService, AprCalculatorService],
  exports: [FarmService],
})
export class FarmModule {}
