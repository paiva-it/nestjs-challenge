import { RecordService } from '@api/records/application/services/record.service';
import { RecordRepositoryPort } from '@api/records/domain/ports/record.repository.port';
import { RecordTracklistServicePort } from '@api/records/domain/ports/record-tracklist.service.port';
import { createRecordRepositoryPortMock } from '@test/__mocks__/domain/record.repository.port.mock';
import { createRecordTracklistServicePortMock } from '@test/__mocks__/domain/record-tracklist.service.port.mock';
import { CreateRecordRequestDTO } from '@api/records/application/dtos/create-record.request.dto';
import { UpdateRecordRequestDTO } from '@api/records/application/dtos/update-record.request.dto';
import { CursorPaginationQueryDto } from '@api/core/pagination/dtos/cursor-pagination.query.dto';
import { OffsetPaginationQueryDto } from '@api/core/pagination/dtos/offset-pagination.query.dto';
import { SearchRecordQueryDto } from '@api/records/application/dtos/search-record.query.dto';

function buildCreateDto(): CreateRecordRequestDTO {
  return {
    artist: 'A',
    album: 'B',
    price: 15,
    qty: 5,
    format: 'VINYL' as any,
    category: 'ROCK' as any,
  };
}

function buildUpdateDto(): UpdateRecordRequestDTO {
  return {
    artist: 'A2',
    album: 'B2',
    price: 20,
    qty: 6,
    format: 'VINYL' as any,
    category: 'ROCK' as any,
  };
}

describe('RecordService', () => {
  let service: RecordService;
  let repositoryMock: ReturnType<typeof createRecordRepositoryPortMock>;
  let tracklistServiceMock: ReturnType<
    typeof createRecordTracklistServicePortMock
  >;

  beforeEach(() => {
    repositoryMock = createRecordRepositoryPortMock();
    tracklistServiceMock = createRecordTracklistServicePortMock();
    service = new RecordService(
      repositoryMock as any as RecordRepositoryPort,
      tracklistServiceMock as any as RecordTracklistServicePort,
    );
  });

  it('create should fetch tracklist and persist', async () => {
    const dto = buildCreateDto();
    const result = await service.create(dto);
    expect(tracklistServiceMock.getTracklist).toHaveBeenCalledWith(dto);
    expect(repositoryMock.create).toHaveBeenCalled();
    expect(result.tracklist).toEqual(['A', 'B']);
  });

  it('update should skip tracklist when shouldUpdate=false', async () => {
    tracklistServiceMock.shouldUpdate.mockReturnValue(false);
    const result = await service.update('id-1', buildUpdateDto());
    expect(tracklistServiceMock.getTracklist).not.toHaveBeenCalled();
    expect(repositoryMock.update).toHaveBeenCalledWith(
      'id-1',
      expect.any(Object),
    );
    expect(result.tracklist).toEqual(['A', 'B']);
  });

  it('update should recompute tracklist when shouldUpdate=true', async () => {
    tracklistServiceMock.shouldUpdate.mockReturnValue(true);
    const result = await service.update('id-2', buildUpdateDto());
    expect(tracklistServiceMock.getTracklist).toHaveBeenCalled();
    expect(repositoryMock.update).toHaveBeenCalledWith(
      'id-2',
      expect.objectContaining({ tracklist: ['A', 'B'] }),
    );
    expect(result.tracklist).toEqual(['A', 'B']);
  });

  it('findWithCursorPagination should delegate to repository', async () => {
    const query: SearchRecordQueryDto = {} as any;
    const pagination: CursorPaginationQueryDto = {
      cursor: null,
      limit: 10,
    } as any;
    const result = await service.findWithCursorPagination(query, pagination);
    expect(repositoryMock.findWithCursorPagination).toHaveBeenCalledWith(
      query,
      pagination,
    );
    expect(result.data.length).toBeGreaterThan(0);
  });

  it('findWithOffsetPagination should delegate to repository', async () => {
    const query: SearchRecordQueryDto = {} as any;
    const pagination: OffsetPaginationQueryDto = {
      page: 1,
      pageSize: 10,
    } as any;
    const result = await service.findWithOffsetPagination(query, pagination);
    expect(repositoryMock.findWithOffsetPagination).toHaveBeenCalledWith(
      query,
      pagination,
    );
    expect(result.data.length).toBeGreaterThan(0);
  });

  it('decreaseQuantity should delegate to repository', async () => {
    const result = await service.decreaseQuantity('id-3', 4);
    expect(repositoryMock.decreaseQuantity).toHaveBeenCalledWith('id-3', 4);
    expect(result.qty).toBe(4);
  });
});
