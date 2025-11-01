import { RecordRepositoryPort } from '@api/records/domain/ports/record.repository.port';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { RecordMongoMapper } from './mappers/record.mongo.mapper';
import { InjectModel } from '@nestjs/mongoose';
import { RecordMongoDocument } from './schemas/record.mongo.schema';
import { Model } from 'mongoose';
import mongodbConfig from '@configuration/mongodb.config';
import { ConfigType } from '@nestjs/config';
import paginationConfig from '@configuration/pagination.config';
import { RecordTokenServicePort } from '@api/records/domain/ports/record-token.service.port';
import {
  RecordEntity,
  RecordEntityCore,
} from '@api/records/domain/entities/record.entity';
import { stringifyUnknownVariable } from '@api/core/log/stringify-unknown-variable.util';
import { stringifyUnknownError } from '@api/core/log/stringify-unknown-error.util';
import { RecordAlreadyExistsException } from '@api/records/application/exceptions/record.already-exists.exception';
import { SearchRecordQueryDto } from '@api/records/application/dtos/search-record.query.dto';
import {
  buildCursorPaginationResponse,
  CursorPaginationResponseDto,
} from '@api/core/pagination/dtos/cursor-pagination.response.dto';
import { CursorPaginationQueryDto } from '@api/core/pagination/dtos/cursor-pagination.query.dto';
import { ensureLimitWithinBounds } from '@api/core/pagination/utils/ensure-limit.util';
import { asyncTimer } from '@api/core/log/async-timer.util';
import { applyCursorQueryMongo } from '@api/core/repository/utils/apply-cursor-query.mongo.util';
import { mapSearchDtoToMongoFilter } from './mappers/record.filter.mapper';
import { OffsetPaginationQueryDto } from '@api/core/pagination/dtos/offset-pagination.query.dto';
import {
  buildOffsetPaginationResponse,
  OffsetPaginationResponseDto,
} from '@api/core/pagination/dtos/offset-pagination.response.dto';
import { computeOffset } from '@api/core/pagination/utils/compute-offset.util';
import { InsufficientStockException } from '@api/records/application/exceptions/insufficient-stock.exception';
import { CachePort } from '@api/core/cache/cache.port';
import { RecordCacheUtil } from '../cache/record-cache.util';
import { CursorSearchCacheUtil } from '../cache/cursor-search-cache.util';
import { OffsetSearchCacheUtil } from '../cache/offset-search-cache.util';

@Injectable()
export class RecordMongoRepository implements RecordRepositoryPort {
  private readonly logger = new Logger(RecordMongoRepository.name);
  private readonly mapper = new RecordMongoMapper();
  private readonly recordCache: RecordCacheUtil;
  private readonly cursorSearchCache: CursorSearchCacheUtil;
  private readonly offsetSearchCache: OffsetSearchCacheUtil;

  constructor(
    @InjectModel(RecordMongoDocument.name)
    private readonly model: Model<RecordMongoDocument>,
    @Inject(RecordTokenServicePort)
    private readonly tokenService: RecordTokenServicePort,
    @Inject(CachePort)
    private readonly cache: CachePort,
    @Inject(mongodbConfig.KEY)
    private readonly mongodb: ConfigType<typeof mongodbConfig>,
    @Inject(paginationConfig.KEY)
    private readonly pagination: ConfigType<typeof paginationConfig>,
  ) {
    this.recordCache = new RecordCacheUtil(this.cache);
    this.cursorSearchCache = new CursorSearchCacheUtil(
      this.cache,
      (id: string) => this.findById(id),
    );
    this.offsetSearchCache = new OffsetSearchCacheUtil(
      this.cache,
      (id: string) => this.findById(id),
    );
  }

  async create(record: Partial<RecordEntityCore>): Promise<RecordEntity> {
    try {
      const mutatedDTO = {
        ...record,
        searchTokens: this.tokenService.generate(record),
      };

      const doc = await this.model.create(mutatedDTO);
      return this.mapper.toEntity(doc);
    } catch (error) {
      if (error.code === 11000) {
        throw new RecordAlreadyExistsException(record);
      }

      this.logger.error(
        `[Record.create] Failed to create record with payload ${stringifyUnknownVariable(record)}: ${stringifyUnknownError(error)}`,
      );
      throw error;
    }
  }

  async update(
    id: string,
    update: Partial<RecordEntityCore>,
  ): Promise<RecordEntity> {
    try {
      const doc = await this.model.findById(id);
      if (!doc) throw new NotFoundException('Record not found');

      doc.set(update);

      if (this.tokenService.needsRecompute(doc.modifiedPaths())) {
        doc.set({ searchTokens: this.tokenService.generate(doc.toObject()) });
      }

      const updated = await doc.save();
      // Invalidate record cache assynchronously for better performance
      this.recordCache.deleteRecord(id);

      return this.mapper.toEntity(updated);
    } catch (err) {
      if (err.code === 11000) {
        throw new RecordAlreadyExistsException(update);
      }

      this.logger.error(
        `[Record.update] Failed to update record with payload ${stringifyUnknownVariable(update)}: ${stringifyUnknownError(err)}`,
      );
      throw err;
    }
  }

  async findById(id: string): Promise<RecordEntity> {
    try {
      const cached = await this.recordCache.getRecord(id);
      if (cached) {
        return cached;
      }

      const doc = await this.model
        .findById(id)
        .lean<RecordMongoDocument>()
        .exec();

      if (!doc) throw new NotFoundException('Record not found');
      const entity = this.mapper.toEntity(doc);

      // Asynchronously set cache for better performance
      this.recordCache.setRecord(entity);

      return entity;
    } catch (error) {
      this.logger.error(
        `[Record.findById] Failed to find record id=${id}: ${stringifyUnknownError(error)}`,
      );
      throw error;
    }
  }

  async findWithCursorPagination(
    _query: SearchRecordQueryDto,
    { limit = this.pagination.defaultLimit, cursor }: CursorPaginationQueryDto,
  ): Promise<CursorPaginationResponseDto<RecordEntity>> {
    ensureLimitWithinBounds(limit, this.pagination.maxLimit);

    const query = mapSearchDtoToMongoFilter(_query);
    const filter = applyCursorQueryMongo(query, cursor);

    const cached = await this.cursorSearchCache.get(filter, { limit, cursor });
    if (cached) return cached;

    const docs = await asyncTimer(
      `[Record.findWithCursorPagination] (MISS) filter=${stringifyUnknownVariable(filter)} limit=${limit}`,
      this.model
        .find(filter)
        .sort({ _id: 1 })
        .select({ _id: 1 })
        .lean<{ _id: string }[]>()
        .exec(),
      this.logger,
      this.mongodb.queryWarningThresholdMs,
    );
    const ids = docs.map((d) => d._id);
    this.cursorSearchCache.set(filter, ids);

    const hydrated = await this.cursorSearchCache.get(filter, {
      limit,
      cursor,
    });
    if (hydrated) return hydrated;

    const fallbackDocs = await this.model
      .find(filter)
      .sort({ _id: 1 })
      .limit(limit + 1)
      .lean<RecordMongoDocument[]>()
      .exec();
    const fallbackEntities = fallbackDocs.map((doc) =>
      this.mapper.toEntity(doc),
    );

    return buildCursorPaginationResponse(cursor, fallbackEntities, limit);
  }

  async findWithOffsetPagination(
    _query: SearchRecordQueryDto,
    {
      limit = this.pagination.defaultLimit,
      page = 1,
    }: OffsetPaginationQueryDto,
  ): Promise<OffsetPaginationResponseDto<RecordEntity>> {
    ensureLimitWithinBounds(limit, this.pagination.maxLimit);

    const query = mapSearchDtoToMongoFilter(_query);
    const { normalizedPage, offset } = computeOffset(page, limit);

    const cached = await this.offsetSearchCache.get(
      query,
      {
        limit,
        page: normalizedPage,
      },
      offset,
    );
    if (cached) return cached;

    const docs = await asyncTimer(
      `[Record.findWithOffsetPagination] (MISS) query=${stringifyUnknownVariable(query)} page=${normalizedPage} limit=${limit}`,
      this.model
        .find(query)
        .sort({ _id: 1 })
        .select({ _id: 1 })
        .lean<{ _id: string }[]>()
        .exec(),
      this.logger,
      this.mongodb.queryWarningThresholdMs,
    );
    const ids = docs.map((d) => d._id);
    this.offsetSearchCache.set(query, ids);

    const hydrated = await this.offsetSearchCache.get(
      query,
      {
        limit,
        page: normalizedPage,
      },
      offset,
    );
    if (hydrated) return hydrated;

    const fallbackDocs = await this.model
      .find(query)
      .sort({ _id: 1 })
      .skip(offset)
      .limit(limit)
      .lean<RecordMongoDocument[]>()
      .exec();
    const fallbackEntities = fallbackDocs.map((doc) =>
      this.mapper.toEntity(doc),
    );

    const total = ids.length;
    return buildOffsetPaginationResponse(
      fallbackEntities,
      total,
      normalizedPage,
      limit,
    );
  }

  async decreaseQuantity(id: string, qty: number): Promise<RecordEntity> {
    try {
      if (qty <= 0) {
        throw new BadRequestException(
          'Quantity to decrease must be greater than zero',
        );
      }

      const updatedDoc = await this.model.findOneAndUpdate(
        { _id: id, qty: { $gte: qty } },
        { $inc: { qty: -qty } },
        { new: true },
      );

      if (!updatedDoc) {
        const doc = await this.model.findById(id);

        if (!doc) {
          throw new NotFoundException('Record not found');
        }

        throw new InsufficientStockException(qty, doc.qty);
      }

      // Invalidate record cache assynchronously for better performance
      this.recordCache.deleteRecord(id);

      return this.mapper.toEntity(updatedDoc);
    } catch (error) {
      this.logger.error(
        `[Record.decreaseQuantity] Failed to decrease quantity id=${id} qty=${qty}: ${stringifyUnknownError(error)}`,
      );
      throw error;
    }
  }
}
