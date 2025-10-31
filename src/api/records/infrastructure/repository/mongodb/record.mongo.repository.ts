import { RecordRepositoryPort } from '@api/records/domain/ports/record.repository.port';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
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
import { stringifyUnkownVariable } from '@api/core/log/stringify-mongo-query.util';
import { stringifyUnknownError } from '@api/core/log/stringify-unkown-error.util';
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

@Injectable()
export class RecordMongoRepository implements RecordRepositoryPort {
  private readonly logger = new Logger(RecordMongoRepository.name);
  private readonly mapper = new RecordMongoMapper();

  constructor(
    @InjectModel(RecordMongoDocument.name)
    private readonly model: Model<RecordMongoDocument>,
    @Inject(mongodbConfig.KEY)
    private readonly mongodb: ConfigType<typeof mongodbConfig>,
    @Inject(paginationConfig.KEY)
    private readonly pagination: ConfigType<typeof paginationConfig>,
    @Inject(RecordTokenServicePort)
    private readonly tokenService: RecordTokenServicePort,
  ) {}

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
        `[Record.create] Failed to create record with payload ${stringifyUnkownVariable(record)}: ${stringifyUnknownError(error)}`,
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

      return this.mapper.toEntity(updated);
    } catch (err) {
      if (err.code === 11000) {
        throw new RecordAlreadyExistsException(update);
      }

      this.logger.error(
        `[Record.update] Failed to update record with payload ${stringifyUnkownVariable(update)}: ${stringifyUnknownError(err)}`,
      );
      throw err;
    }
  }

  async findById(id: string): Promise<RecordEntity> {
    try {
      const doc = await this.model
        .findById(id)
        .lean<RecordMongoDocument>()
        .exec();

      if (!doc) throw new NotFoundException('Record not found');

      return this.mapper.toEntity(doc);
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

    const docs = await asyncTimer(
      `[Record.findWithCursorPagination] filter=${stringifyUnkownVariable(filter)} limit=${limit}`,
      this.model
        .find(filter)
        .sort({ _id: 1 })
        .limit(limit + 1)
        .lean<RecordMongoDocument[]>()
        .exec(),
      this.logger,
      this.mongodb.queryWarningThresholdMs,
    );

    const entities = docs.map((doc) => this.mapper.toEntity(doc));

    return buildCursorPaginationResponse(cursor, entities, limit);
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

    const [itemsResult, totalResult] = await asyncTimer(
      `[Record.findWithOffsetPagination] query=${stringifyUnkownVariable(
        query,
      )} page=${normalizedPage} limit=${limit}`,
      Promise.allSettled([
        this.model
          .find(query)
          .sort({ _id: 1 })
          .skip(offset)
          .limit(limit)
          .lean<RecordMongoDocument[]>()
          .exec(),
        this.model.countDocuments(query).exec(),
      ]),
      this.logger,
      this.mongodb.queryWarningThresholdMs,
    );

    if (itemsResult.status === 'rejected') {
      throw new InternalServerErrorException(itemsResult.reason);
    }
    if (totalResult.status === 'rejected') {
      throw new InternalServerErrorException(totalResult.reason);
    }

    const entities = itemsResult.value.map((doc) => this.mapper.toEntity(doc));

    return buildOffsetPaginationResponse(
      entities,
      totalResult.value,
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

      return this.mapper.toEntity(updatedDoc);
    } catch (error) {
      this.logger.error(
        `[Record.decreaseQuantity] Failed to decrease quantity id=${id} qty=${qty}: ${stringifyUnknownError(error)}`,
      );
      throw error;
    }
  }
}
