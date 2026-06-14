import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { RedisService } from '../../shared/redis/redis.service';
import { EventProcessorService } from './event-processor.service';

export interface IndexerEvent {
  type: 'Swap' | 'Mint' | 'Burn' | 'PoolCreated' | 'FeeCollected';
  txHash: string;
  eventIndex: number;
  ledger: number;
  timestamp: number;
  data: Record<string, unknown>;
}

@Injectable()
export class StellarIndexerService implements OnModuleInit {
  private readonly logger = new Logger(StellarIndexerService.name);
  private readonly pollIntervalMs: number;
  private readonly batchSize: number;
  private readonly rpcUrl: string;
  private readonly LAST_LEDGER_KEY = 'indexer:last_processed_ledger';

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly eventProcessorService: EventProcessorService,
  ) {
    this.pollIntervalMs = this.configService.get<number>('indexer.pollIntervalMs') || 5000;
    this.batchSize = this.configService.get<number>('indexer.batchSize') || 100;
    this.rpcUrl = this.configService.get<string>('stellar.rpcUrl') || 'https://soroban-testnet.stellar.org';
  }

  async onModuleInit() {
    const lastLedger = await this.redisService.get<number>(this.LAST_LEDGER_KEY);
    if (!lastLedger) {
      const startLedger = this.configService.get<number>('indexer.startLedger') || 1000000;
      await this.redisService.set(this.LAST_LEDGER_KEY, startLedger);
      this.logger.log(`Initialized indexer from ledger ${startLedger}`);
    }
  }

  @Interval('pollLedgers', 5000)
  async pollLedgers(): Promise<IndexerEvent[]> {
    try {
      const lastLedger = (await this.redisService.get<number>(this.LAST_LEDGER_KEY)) || 1000000;
      const latestLedger = await this.fetchLatestLedger();
      if (latestLedger <= lastLedger) return [];

      const events: IndexerEvent[] = [];
      const endLedger = Math.min(lastLedger + this.batchSize, latestLedger);
      const ledgerRange = await this.fetchLedgerRange(lastLedger + 1, endLedger);

      for (const entry of ledgerRange) {
        const parsedEvents = this.parseContractEvents(entry);
        events.push(...parsedEvents);
      }

      if (events.length > 0) {
        await this.eventProcessorService.processEvents(events);
      }

      await this.redisService.set(this.LAST_LEDGER_KEY, endLedger);
      this.logger.debug(`Indexed ledgers ${lastLedger + 1}-${endLedger}, ${events.length} events`);

      return events;
    } catch (err) {
      this.logger.error('Poll ledgers error', err instanceof Error ? err.message : err);
      return [];
    }
  }

  private async fetchLatestLedger(): Promise<number> {
    try {
      const response = await fetch(`${this.rpcUrl}/rpc/v1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getLatestLedger',
          params: {},
        }),
      });
      const data = await response.json() as { result?: { sequence?: number } };
      return data?.result?.sequence || 0;
    } catch {
      try {
        const response = await fetch(`${this.rpcUrl}/ledgers?order=desc&limit=1`);
        const data = await response.json() as { _embedded?: { records?: { sequence?: number }[] } };
        return data?._embedded?.records?.[0]?.sequence || 0;
      } catch {
        return 0;
      }
    }
  }

  private async fetchLedgerRange(from: number, to: number): Promise<Record<string, unknown>[]> {
    try {
      const response = await fetch(`${this.rpcUrl}/rpc/v1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getEvents',
          params: {
            startLedger: from,
            endLedger: to,
            limit: this.batchSize,
          },
        }),
      });
      const data = await response.json() as { result?: { events?: Record<string, unknown>[] } };
      return data?.result?.events || [];
    } catch {
      this.logger.warn(`Failed to fetch ledger range ${from}-${to}`);
      return [];
    }
  }

  private parseContractEvents(rawEvent: Record<string, unknown>): IndexerEvent[] {
    const events: IndexerEvent[] = [];
    try {
      const value = rawEvent.value as Record<string, unknown> | undefined;
      const topic = value?.topic as string[] | undefined;
      const data = value?.data as string | undefined;

      if (!topic || topic.length < 2) return [];

      const eventType = topic[1]?.toString() || '';
      const txHash = (rawEvent.id as string || 'unknown').split('-')[0];
      const eventIndex = parseInt((rawEvent.id as string || '0').split('-').pop() || '0', 10);
      const ledger = parseInt(rawEvent.ledger as string || '0', 10);

      const base = {
        txHash,
        eventIndex,
        ledger,
        timestamp: Date.now(),
        data: {},
      };

      switch (eventType) {
        case 'Swap':
          events.push({
            ...base,
            type: 'Swap',
            data: this.decodeSwapEvent(topic, data),
          });
          break;
        case 'Mint':
          events.push({
            ...base,
            type: 'Mint',
            data: this.decodeMintEvent(topic, data),
          });
          break;
        case 'Burn':
          events.push({
            ...base,
            type: 'Burn',
            data: this.decodeBurnEvent(topic, data),
          });
          break;
        case 'PoolCreated':
          events.push({
            ...base,
            type: 'PoolCreated',
            data: this.decodePoolCreatedEvent(topic, data),
          });
          break;
      }
    } catch (err) {
      this.logger.warn('Failed to parse event', err);
    }

    return events;
  }

  private decodeSwapEvent(topic: string[], data?: string): Record<string, unknown> {
    return {
      caller: topic[2] || '',
      tokenIn: topic[3] || '',
      tokenOut: topic[4] || '',
      amountIn: data || '0',
      amountOut: data || '0',
    };
  }

  private decodeMintEvent(topic: string[], data?: string): Record<string, unknown> {
    return {
      provider: topic[2] || '',
      amountA: data || '0',
      amountB: data || '0',
    };
  }

  private decodeBurnEvent(topic: string[], data?: string): Record<string, unknown> {
    return {
      provider: topic[2] || '',
      amountA: data || '0',
      amountB: data || '0',
    };
  }

  private decodePoolCreatedEvent(topic: string[], data?: string): Record<string, unknown> {
    return {
      pool: topic[2] || '',
      tokenA: topic[3] || '',
      tokenB: topic[4] || '',
      feeTier: data || '30',
    };
  }

  async getLastProcessedLedger(): Promise<number> {
    return (await this.redisService.get<number>(this.LAST_LEDGER_KEY)) || 0;
  }
}
