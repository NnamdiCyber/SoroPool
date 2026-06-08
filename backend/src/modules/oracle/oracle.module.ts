import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TwapService } from './twap.service';
import { OracleScheduler } from './oracle.scheduler';

@Module({
  imports: [ScheduleModule],
  providers: [TwapService, OracleScheduler],
  exports: [TwapService],
})
export class OracleModule {}
