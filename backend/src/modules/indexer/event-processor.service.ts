import { Injectable } from '@nestjs/common';

@Injectable()
export class EventProcessorService {
  async processEvent(event: any) {
    const _ = event;
    return null;
  }
}
