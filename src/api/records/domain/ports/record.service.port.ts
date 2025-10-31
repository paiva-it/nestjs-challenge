import { CreateRecordRequestDTO } from '@api/records/application/dtos/create-record.request.dto';
import { RecordEntity } from '../entities/record.entity';
import { UpdateRecordRequestDTO } from '@api/records/application/dtos/update-record.request.dto';
import { SearchRecordQueryDto } from '@api/records/application/dtos/search-record.query.dto';
import { CursorPaginationQueryDto } from '@api/core/pagination/dtos/cursor-pagination.query.dto';
import { CursorPaginationResponseDto } from '@api/core/pagination/dtos/cursor-pagination.response.dto';
import { OffsetPaginationQueryDto } from '@api/core/pagination/dtos/offset-pagination.query.dto';
import { OffsetPaginationResponseDto } from '@api/core/pagination/dtos/offset-pagination.response.dto';

export const RecordServicePort = Symbol('RecordServicePort');

export interface RecordServicePort {
  create: (record: CreateRecordRequestDTO) => Promise<RecordEntity>;
  update: (id: string, update: UpdateRecordRequestDTO) => Promise<RecordEntity>;
  findWithCursorPagination(
    query: SearchRecordQueryDto,
    pagination: CursorPaginationQueryDto,
  ): Promise<CursorPaginationResponseDto<RecordEntity>>;
  findWithOffsetPagination(
    query: SearchRecordQueryDto,
    pagination: OffsetPaginationQueryDto,
  ): Promise<OffsetPaginationResponseDto<RecordEntity>>;
  decreaseQuantity(id: string, qty: number): Promise<RecordEntity>;
}
