import { FilterQuery } from 'mongoose';
import { RecordEntity } from '@api/records/domain/entities/record.entity';
import { Logger } from '@nestjs/common';
import { stringifyUnknownError } from '@api/core/log/stringify-unknown-error.util';
import { stringifyUnknownVariable } from '@api/core/log/stringify-unknown-variable.util';
import { searchCacheKey } from './key-builder.util';
import { CachePort } from '@api/core/cache/cache.port';
import { CursorPaginationQueryDto } from '@api/core/pagination/dtos/cursor-pagination.query.dto';
import { CursorPaginationResponseDto } from '@api/core/pagination/dtos/cursor-pagination.response.dto';
import { buildCursorPaginationResponse } from '@api/core/pagination/utils/build-cursor-pagination-response.util';
import { RecordRepositoryPort } from '@api/records/domain/ports/record.repository.port';

export class CursorSearchCacheUtil {
  private readonly logger = new Logger(CursorSearchCacheUtil.name);
  private readonly TTL_SECONDS = 60; // 60 seconds

  constructor(
    private readonly cache: CachePort,
    private readonly findById: RecordRepositoryPort['findById'],
  ) {}

  async get(
    query: FilterQuery<RecordEntity>,
    { limit, cursor }: CursorPaginationQueryDto,
  ): Promise<CursorPaginationResponseDto<RecordEntity> | null> {
    const key = searchCacheKey(query);
    try {
      const payload = await this.cache.get<string[]>(key);

      const sliceStart = cursor
        ? payload.findIndex((id) => id === cursor) + 1
        : 0;
      if (sliceStart < 0) return null;

      const sliced = payload.slice(sliceStart, sliceStart + limit + 1);
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
          `[CursorSearchCache] Hydration failure query=${stringifyUnknownVariable(query)} errors=${errors}`,
        );
        return null;
      }

      return buildCursorPaginationResponse(
        cursor,
        results.map((r) => (r as PromiseFulfilledResult<RecordEntity>).value),
        limit,
      );
    } catch (error) {
      this.logger.warn(
        `[CursorSearchCache][SearchCache] Failed to get query=${stringifyUnknownVariable(query)}: ${stringifyUnknownError(error)}`,
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
        `[CursorSearchCache] Failed to set key=${key} ids=${ids.length}: ${stringifyUnknownError(error)}`,
      );
    }
  }
}
