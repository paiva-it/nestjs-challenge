import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { RecordRepositoryPort } from '../ports/record.repository.port';
import { InjectModel } from '@nestjs/mongoose';
import { Record } from '../schemas/record.schema';
import { FilterQuery, Model } from 'mongoose';
import paginationConfig from 'src/configuration/pagination.config';
import { ConfigType } from '@nestjs/config';
import { CursorPaginationQueryDto } from '../common/pagination/dtos/cursor-pagination.query.dto';
import {
  CursorPaginationResponseDto,
  buildCursorPaginationResponse,
} from '../common/pagination/dtos/cursor-pagination.response.dto';
import { asyncTimer } from '../common/log/utils/async-timer.util';
import { OffsetPaginationQueryDto } from '../common/pagination/dtos/offset-pagination.query.dto';
import {
  OffsetPaginationResponseDto,
  buildOffsetPaginationResponse,
} from '../common/pagination/dtos/offset-pagination.response.dto';
import mongodbConfig from 'src/configuration/mongodb.config';
import { ensureLimitWithinBounds } from '../common/pagination/utils/ensure-limit.util';
import { applyCursorQuery } from '../common/pagination/utils/apply-cursor-query.util';
import { computeOffset } from '../common/pagination/utils/compute-offset.util';
import { stringifyMongoQuery } from '../common/log/utils/stringify-mongo-query.util';

@Injectable()
export class RecordMongoRepository implements RecordRepositoryPort {
  private readonly logger = new Logger(RecordMongoRepository.name);

  constructor(
    @InjectModel(Record.name)
    private readonly model: Model<Record>,

    @Inject(paginationConfig.KEY)
    private readonly pagination: ConfigType<typeof paginationConfig>,

    @Inject(mongodbConfig.KEY)
    private readonly mongodb: ConfigType<typeof mongodbConfig>,
  ) {}

  async findWithCursorPagination(
    query: FilterQuery<Record>,
    { limit, cursor }: CursorPaginationQueryDto,
  ): Promise<CursorPaginationResponseDto<Record>> {
    ensureLimitWithinBounds(limit, this.pagination.maxLimit);

    const filter = applyCursorQuery(query, cursor);

    const docs = await asyncTimer(
      `[Record.findWithCursorPagination] filter=${stringifyMongoQuery(filter)} limit=${limit}`,
      this.model
        .find(filter)
        .sort({ _id: 1 })
        .limit(limit + 1)
        .lean<Record[]>()
        .exec(),
      this.logger,
      this.mongodb.queryWarningThresholdMs,
    );

    return buildCursorPaginationResponse(cursor, docs, limit);
  }

  async findWithOffsetPagination(
    query: FilterQuery<Record>,
    { page = 1, limit }: OffsetPaginationQueryDto,
  ): Promise<OffsetPaginationResponseDto<Record>> {
    ensureLimitWithinBounds(limit, this.pagination.maxLimit);

    const { normalizedPage, offset } = computeOffset(page, limit);

    const [itemsResult, totalResult] = await asyncTimer(
      `[Record.findWithOffsetPagination] query=${stringifyMongoQuery(
        query,
      )} page=${normalizedPage} limit=${limit}`,
      Promise.allSettled([
        this.model
          .find(query)
          .sort({ _id: 1 })
          .skip(offset)
          .limit(limit)
          .lean<Record[]>()
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

    return buildOffsetPaginationResponse(
      itemsResult.value,
      totalResult.value,
      normalizedPage,
      limit,
    );
  }
}
