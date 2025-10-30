import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { RecordRepositoryPort } from '../ports/record.repository.port';
import { InjectModel } from '@nestjs/mongoose';
import { Record } from '../schemas/record.schema';
import { FilterQuery, Model } from 'mongoose';
import paginationConfig from '../../../configuration/pagination.config';
import { ConfigType } from '@nestjs/config';
import { CursorPaginationQueryDto } from '../../common/pagination/dtos/cursor-pagination.query.dto';
import {
  CursorPaginationResponseDto,
  buildCursorPaginationResponse,
} from '../../common/pagination/dtos/cursor-pagination.response.dto';
import { asyncTimer } from '../../common/log/utils/async-timer.util';
import { OffsetPaginationQueryDto } from '../../common/pagination/dtos/offset-pagination.query.dto';
import {
  OffsetPaginationResponseDto,
  buildOffsetPaginationResponse,
} from '../../common/pagination/dtos/offset-pagination.response.dto';
import mongodbConfig from '../../../configuration/mongodb.config';
import { ensureLimitWithinBounds } from '../../common/pagination/utils/ensure-limit.util';
import { applyCursorQuery } from '../../common/pagination/utils/apply-cursor-query.util';
import { computeOffset } from '../../common/pagination/utils/compute-offset.util';
import { stringifyUnkownVariable } from '../../common/log/utils/stringify-mongo-query.util';
import { RecordAlreadyExistsException } from '../exceptions/record.already-exists.exception';
import { RecordTokenServicePort } from '../ports/record-token.service.port';
import { stringifyUnknownError } from '../../common/log/utils/stringify-unkown-error.util';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';

@Injectable()
export class RecordMongoRepository implements RecordRepositoryPort {
  private readonly logger = new Logger(RecordMongoRepository.name);

  constructor(
    @InjectModel(Record.name)
    private readonly model: Model<Record>,

    @Inject(mongodbConfig.KEY)
    private readonly mongodb: ConfigType<typeof mongodbConfig>,

    @Inject(paginationConfig.KEY)
    private readonly pagination: ConfigType<typeof paginationConfig>,

    @Inject(RecordTokenServicePort)
    private readonly tokenService: RecordTokenServicePort,
  ) {}

  async create(record: CreateRecordRequestDTO): Promise<Record> {
    try {
      const mutatedDTO = {
        ...record,
        searchTokens: this.tokenService.generate(record),
      };

      return await new this.model(mutatedDTO).save();
    } catch (err) {
      if (err.code === 11000) {
        throw new RecordAlreadyExistsException(record);
      }

      this.logger.error(
        `[Record.create] Failed to create record with payload ${stringifyUnkownVariable(record)}: ${stringifyUnknownError(err)}`,
      );
      throw err;
    }
  }

  async update(id: string, update: UpdateRecordRequestDTO): Promise<Record> {
    const session = await this.model.startSession();

    try {
      session.startTransaction();

      const doc = await this.model.findById(id).session(session);
      if (!doc) throw new NotFoundException('Record not found');

      doc.set(update);

      if (this.tokenService.needsRecompute(doc.modifiedPaths())) {
        doc.set({ searchTokens: this.tokenService.generate(doc.toObject()) });
      }

      const updated = await doc.save({ session });
      await session.commitTransaction();

      return updated;
    } catch (err) {
      await session.abortTransaction();

      if (err.code === 11000) {
        throw new RecordAlreadyExistsException(update);
      }

      this.logger.error(
        `[Record.update] Failed to update record with payload ${stringifyUnkownVariable(update)}: ${stringifyUnknownError(err)}`,
      );
      throw err;
    } finally {
      await session.endSession();
    }
  }

  async findWithCursorPagination(
    query: FilterQuery<Record>,
    { limit = this.pagination.defaultLimit, cursor }: CursorPaginationQueryDto,
  ): Promise<CursorPaginationResponseDto<Record>> {
    ensureLimitWithinBounds(limit, this.pagination.maxLimit);

    const filter = applyCursorQuery(query, cursor);

    const docs = await asyncTimer(
      `[Record.findWithCursorPagination] filter=${stringifyUnkownVariable(filter)} limit=${limit}`,
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
    {
      limit = this.pagination.defaultLimit,
      page = 1,
    }: OffsetPaginationQueryDto,
  ): Promise<OffsetPaginationResponseDto<Record>> {
    ensureLimitWithinBounds(limit, this.pagination.maxLimit);

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
