import { CachePort } from '@api/core/cache/cache.port';
import { RecordEntity } from '@api/records/domain/entities/record.entity';
import { Logger } from '@nestjs/common';
import { stringifyUnknownError } from '@api/core/log/stringify-unknown-error.util';
import { recordCacheKey } from './key-builder.util';

export class RecordCacheUtil {
  private readonly logger = new Logger(RecordCacheUtil.name);
  private readonly TTL_SECONDS = 10 * 60; // 10 minutes
  constructor(private readonly cache: CachePort) {}

  async getRecord(id: string): Promise<RecordEntity | null> {
    try {
      return await this.cache.get<RecordEntity>(recordCacheKey(id));
    } catch (error) {
      this.logger.warn(
        `[RecordCache.getRecord] Failed id=${id}: ${stringifyUnknownError(error)}`,
      );
      return null;
    }
  }

  async setRecord(record: RecordEntity): Promise<void> {
    try {
      await this.cache.set<RecordEntity>(
        recordCacheKey(record.id),
        record,
        this.TTL_SECONDS,
      );
    } catch (error) {
      this.logger.warn(
        `[RecordCache.setRecord] Failed id=${record.id}: ${stringifyUnknownError(error)}`,
      );
    }
  }

  async deleteRecord(id: string): Promise<void> {
    try {
      await this.cache.delete(recordCacheKey(id));
    } catch (error) {
      this.logger.warn(
        `[RecordCache.deleteRecord] Failed id=${id}: ${stringifyUnknownError(error)}`,
      );
    }
  }
}
