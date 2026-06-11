import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly client: Redis;
  private readonly defaultTtl: number;
  private readonly logger = new Logger(RedisService.name);

  constructor(configService: ConfigService) {
    const host = configService.get<string>('redis.host') || 'localhost';
    const port = parseInt(configService.get<string>('redis.port') || '6379', 10);
    const password = configService.get<string>('redis.password');
    this.defaultTtl = parseInt(configService.get<string>('redis.ttl') || '300', 10);

    this.client = new Redis({ host, port, password, retryStrategy: (times) => Math.min(times * 50, 2000) });
    this.client.on('error', (err) => this.logger.error('Redis connection error', err));
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return raw as unknown as T; }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    const ttl = ttlSeconds ?? this.defaultTtl;
    if (ttl > 0) {
      await this.client.setex(key, ttl, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const value = await fetchFn();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
