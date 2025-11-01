import { FilterQuery } from 'mongoose';
import { RecordEntity } from '@api/records/domain/entities/record.entity';
import { Logger } from '@nestjs/common';
import { stringifyUnknownError } from '@api/core/log/stringify-unknown-error.util';
import { stringifyUnknownVariable } from '@api/core/log/stringify-unknown-variable.util';
import { searchCacheKey } from './key-builder.util';
import { CachePort } from '@api/core/cache/cache.port';
import { OffsetPaginationQueryDto } from '@api/core/pagination/dtos/offset-pagination.query.dto';
import {
  buildOffsetPaginationResponse,
  OffsetPaginationResponseDto,
} from '@api/core/pagination/dtos/offset-pagination.response.dto';
import { RecordRepositoryPort } from '@api/records/domain/ports/record.repository.port';

export class OffsetSearchCacheUtil {
  private readonly logger = new Logger(OffsetSearchCacheUtil.name);
  private readonly TTL_SECONDS = 60; // 60 seconds

  constructor(
    private readonly cache: CachePort,
    private readonly findById: RecordRepositoryPort['findById'],
  ) {}

  async get(
    query: FilterQuery<RecordEntity>,
    { limit, page }: OffsetPaginationQueryDto,
    offset: number,
  ): Promise<OffsetPaginationResponseDto<RecordEntity> | null> {
    try {
      const key = searchCacheKey(query);

      const payload = await this.cache.get<string[]>(key);
      const sliced = payload.slice(offset, offset + limit);
      const results = await Promise.allSettled(
        sliced.map((id) => this.findById(id)),
      );

      if (!results.every((r) => r.status === 'fulfilled')) {
        const errors = results
          .filter((e) => e.status === 'rejected')
          .map((r) =>
            stringifyUnknownError((r as PromiseRejectedResult).reason),
          )
          .join(', ');
        this.logger.warn(
          `[OffsetSearchCache] Hydration failure query=${stringifyUnknownVariable(query)} errors=${errors}`,
        );
        return null;
      }

      return buildOffsetPaginationResponse(
        results.map((r) => (r as PromiseFulfilledResult<RecordEntity>).value),
        payload.length,
        page,
        limit,
      );
    } catch (error) {
      this.logger.warn(
        `[OffsetSearchCache][SearchCache] Failed to get query=${query}: ${stringifyUnknownError(error)}`,
      );
      return null;
    }
  }

  async set(query: FilterQuery<RecordEntity>, ids: string[]): Promise<void> {
    const key = searchCacheKey(query);
    try {
      await this.cache.set<string[]>(key, ids, this.TTL_SECONDS);
    } catch (error) {
      this.logger.warn(
        `[OffsetSearchCache] Failed to set query=${query} ids=${ids.length}: ${stringifyUnknownError(error)}`,
      );
    }
  }
}
