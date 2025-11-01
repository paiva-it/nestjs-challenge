import { Inject, Injectable } from '@nestjs/common';
import { SearchRecordQueryDto } from '../dtos/search-record.query.dto';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';
import { Transactional } from '@api/core/tx/transactional.decorator';
import {
  RecordEntity,
  RecordEntityCore,
} from '@api/records/domain/entities/record.entity';
import { CursorPaginationQueryDto } from '@api/core/pagination/dtos/cursor-pagination.query.dto';
import { CursorPaginationResponseDto } from '@api/core/pagination/dtos/cursor-pagination.response.dto';
import { OffsetPaginationQueryDto } from '@api/core/pagination/dtos/offset-pagination.query.dto';
import { OffsetPaginationResponseDto } from '@api/core/pagination/dtos/offset-pagination.response.dto';
import { RecordServicePort } from '@api/records/domain/ports/record.service.port';
import { RecordRepositoryPort } from '@api/records/domain/ports/record.repository.port';
import { RecordTracklistServicePort } from '@api/records/domain/ports/record-tracklist.service.port';

@Injectable()
export class RecordService implements RecordServicePort {
  constructor(
    @Inject(RecordRepositoryPort)
    private readonly repository: RecordRepositoryPort,
    @Inject(RecordTracklistServicePort)
    private readonly tracklistService: RecordTracklistServicePort,
  ) {}

  async create(dto: CreateRecordRequestDTO): Promise<RecordEntity> {
    const tracklist = await this.tracklistService.getTracklist(dto);

    return await this.repository.create({ ...dto, tracklist });
  }

  @Transactional()
  async update(id: string, dto: UpdateRecordRequestDTO): Promise<RecordEntity> {
    const current = await this.repository.findById(id);
    const mutatedDto: Partial<RecordEntityCore> = { ...dto };

    if (this.tracklistService.shouldUpdate(current, dto)) {
      mutatedDto.tracklist = await this.tracklistService.getTracklist(dto);
    }

    return await this.repository.update(id, mutatedDto);
  }

  async findWithCursorPagination(
    query: SearchRecordQueryDto,
    pagination: CursorPaginationQueryDto,
  ): Promise<CursorPaginationResponseDto<RecordEntity>> {
    return await this.repository.findWithCursorPagination(query, pagination);
  }

  async findWithOffsetPagination(
    query: SearchRecordQueryDto,
    pagination: OffsetPaginationQueryDto,
  ): Promise<OffsetPaginationResponseDto<RecordEntity>> {
    return await this.repository.findWithOffsetPagination(query, pagination);
  }

  @Transactional()
  async decreaseQuantity(id: string, quantity: number): Promise<RecordEntity> {
    return await this.repository.decreaseQuantity(id, quantity);
  }
}
