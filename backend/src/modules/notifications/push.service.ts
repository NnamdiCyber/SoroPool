import { Injectable } from '@nestjs/common';

@Injectable()
export class PushService {
  async sendPush(subscription: any, payload: any) {
    const _ = { subscription, payload };
    return { sent: true };
  }
}
