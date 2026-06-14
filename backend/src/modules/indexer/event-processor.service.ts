import { Injectable, Logger } from '@nestjs/common';
import { IndexerEvent } from './stellar-indexer.service';
import { SwapIndexerService } from './swap-indexer.service';
import { LiquidityIndexerService } from './liquidity-indexer.service';

@Injectable()
export class EventProcessorService {
  private readonly logger = new Logger(EventProcessorService.name);
  private readonly processedKeys = new Set<string>();

  constructor(
    private readonly swapIndexerService: SwapIndexerService,
    private readonly liquidityIndexerService: LiquidityIndexerService,
  ) {}

  async processEvents(events: IndexerEvent[]): Promise<void> {
    for (const event of events) {
      const dedupKey = `${event.txHash}:${event.eventIndex}`;
      if (this.processedKeys.has(dedupKey)) continue;
      this.processedKeys.add(dedupKey);

      try {
        await this.routeEvent(event);
      } catch (err) {
        this.logger.error(`Failed to process event ${dedupKey}: ${event.type}`, err);
      }
    }

    if (this.processedKeys.size > 10000) {
      const keys = Array.from(this.processedKeys);
      for (const k of keys.slice(0, keys.length - 5000)) {
        this.processedKeys.delete(k);
      }
    }
  }

  private async routeEvent(event: IndexerEvent): Promise<void> {
    switch (event.type) {
      case 'Swap':
        await this.swapIndexerService.indexSwap(event);
        break;
      case 'Mint':
        await this.liquidityIndexerService.indexMint(event);
        break;
      case 'Burn':
        await this.liquidityIndexerService.indexBurn(event);
        break;
      case 'PoolCreated':
        this.logger.log(`Pool created event: ${JSON.stringify(event.data)}`);
        break;
      case 'FeeCollected':
        this.logger.log(`Fee collected event: ${JSON.stringify(event.data)}`);
        break;
      default:
        this.logger.warn(`Unknown event type: ${event.type}`);
    }
  }
}
