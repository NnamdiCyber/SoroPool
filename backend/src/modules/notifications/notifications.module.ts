import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { PushService } from './push.service';
import { RangeAlertService } from './range-alert.service';

@Module({
  providers: [EmailService, PushService, RangeAlertService],
  exports: [EmailService, PushService, RangeAlertService],
})
export class NotificationsModule {}
