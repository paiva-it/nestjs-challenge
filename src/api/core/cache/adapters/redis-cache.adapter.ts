import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import { CachePort } from '../cache.port';
import redisConfig from '@configuration/redis.config';

@Injectable()
export class RedisCacheAdapter implements CachePort {
  private readonly logger = new Logger(RedisCacheAdapter.name);
  private client: RedisClientType;

  constructor(
    @Inject(redisConfig.KEY) private redis: ConfigType<typeof redisConfig>,
  ) {
    this.client = createClient({
      socket: {
        host: redis.host,
        port: redis.port,
      },
    });

    this.client.connect().catch((err) => {
      this.logger.error('Redis connection failed', err);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const val = (await this.client.get(key)) as string | null;

    if (!val) {
      return null;
    }

    return JSON.parse(val) as T;
  }

  async set<T>(
    key: string,
    value: T,
    ttlSeconds: number = this.redis.ttl,
  ): Promise<void> {
    await this.client.set(key, JSON.stringify(value), {
      EX: ttlSeconds,
    });
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }
}
