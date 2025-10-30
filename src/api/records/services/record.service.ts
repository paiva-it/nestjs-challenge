import { Inject, Injectable } from '@nestjs/common';
import { RecordRepositoryPort } from '../ports/record.repository.port';
import { SearchRecordQueryDto } from '../dtos/search-record.query.dto';
import { CursorPaginationQueryDto } from '../../common/pagination/dtos/cursor-pagination.query.dto';
import { CursorPaginationResponseDto } from '../../common/pagination/dtos/cursor-pagination.response.dto';
import { buildRecordSearchQuery } from '../utils/record.search-query.builder';
import { Record } from '../schemas/record.schema';
import { OffsetPaginationQueryDto } from '../../common/pagination/dtos/offset-pagination.query.dto';
import { OffsetPaginationResponseDto } from '../../common/pagination/dtos/offset-pagination.response.dto';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';

@Injectable()
export class RecordService {
  constructor(
    @Inject(RecordRepositoryPort)
    private readonly repository: RecordRepositoryPort,
  ) {}

  async create(dto: CreateRecordRequestDTO): Promise<Record> {
    return await this.repository.create(dto);
  }

  async update(id: string, dto: UpdateRecordRequestDTO): Promise<Record> {
    return await this.repository.update(id, dto);
  }

  async findWithCursorPagination(
    search: SearchRecordQueryDto,
    pagination: CursorPaginationQueryDto,
  ): Promise<CursorPaginationResponseDto<Record>> {
    const query = buildRecordSearchQuery(search);

    return await this.repository.findWithCursorPagination(query, pagination);
  }

  async findWithOffsetPagination(
    search: SearchRecordQueryDto,
    pagination: OffsetPaginationQueryDto,
  ): Promise<OffsetPaginationResponseDto<Record>> {
    const query = buildRecordSearchQuery(search);

    return await this.repository.findWithOffsetPagination(query, pagination);
  }
}
