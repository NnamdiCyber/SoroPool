import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class OracleScheduler {
  @Cron('*/60 * * * * *')
  async refreshPrices() {
    // Refresh oracle prices every 60s
  }
}
