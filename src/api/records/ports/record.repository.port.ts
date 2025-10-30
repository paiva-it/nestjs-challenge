import { FilterQuery } from 'mongoose';
import { Record } from '../schemas/record.schema';
import { CursorPaginationResponseDto } from '../../common/pagination/dtos/cursor-pagination.response.dto';
import { OffsetPaginationResponseDto } from '../../common/pagination/dtos/offset-pagination.response.dto';
import { CursorPaginationQueryDto } from '../../common/pagination/dtos/cursor-pagination.query.dto';
import { OffsetPaginationQueryDto } from '../../common/pagination/dtos/offset-pagination.query.dto';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';

export const RecordRepositoryPort = Symbol('RecordRepositoryPort');

export interface RecordRepositoryPort {
  create: (record: CreateRecordRequestDTO) => Promise<Record>;
  update: (id: string, update: UpdateRecordRequestDTO) => Promise<Record>;
  findWithCursorPagination(
    query: FilterQuery<Record>,
    pagination: CursorPaginationQueryDto,
  ): Promise<CursorPaginationResponseDto<Record>>;
  findWithOffsetPagination(
    query: FilterQuery<Record>,
    pagination: OffsetPaginationQueryDto,
  ): Promise<OffsetPaginationResponseDto<Record>>;
}
