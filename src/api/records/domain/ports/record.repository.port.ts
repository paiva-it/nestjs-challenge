import { RecordEntity, RecordEntityCore } from '../entities/record.entity';
import { CursorPaginationQueryDto } from '@api/core/pagination/dtos/cursor-pagination.query.dto';
import { CursorPaginationResponseDto } from '@api/core/pagination/dtos/cursor-pagination.response.dto';
import { OffsetPaginationQueryDto } from '@api/core/pagination/dtos/offset-pagination.query.dto';
import { OffsetPaginationResponseDto } from '@api/core/pagination/dtos/offset-pagination.response.dto';
import { SearchRecordQueryDto } from '@api/records/application/dtos/search-record.query.dto';

export const RecordRepositoryPort = Symbol('RecordRepositoryPort');

export interface RecordRepositoryPort {
  create: (record: Partial<RecordEntityCore>) => Promise<RecordEntity>;
  update: (
    id: string,
    update: Partial<RecordEntityCore>,
  ) => Promise<RecordEntity>;
  findById(id: string): Promise<RecordEntity>;
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
