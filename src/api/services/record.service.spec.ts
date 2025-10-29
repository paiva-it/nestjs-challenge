import { RecordService } from './record.service';
import { RecordRepositoryPort } from '../ports/record.repository.port';
import { SearchRecordQueryDto } from '../dtos/search-record.query.dto';
import { CursorPaginationQueryDto } from '../common/pagination/dtos/cursor-pagination.query.dto';
import { OffsetPaginationQueryDto } from '../common/pagination/dtos/offset-pagination.query.dto';
import { buildRecordSearchQuery } from '../utils/record.search-query.builder';
import { CursorPaginationResponseDto } from '../common/pagination/dtos/cursor-pagination.response.dto';
import { OffsetPaginationResponseDto } from '../common/pagination/dtos/offset-pagination.response.dto';

jest.mock('../utils/record.search-query.builder', () => ({
  buildRecordSearchQuery: jest.fn((filters) => ({ mocked: true, filters })),
}));

describe('RecordService', () => {
  let service: RecordService;
  let repository: jest.Mocked<RecordRepositoryPort>;

  beforeEach(() => {
    repository = {
      findWithCursorPagination: jest.fn(),
      findWithOffsetPagination: jest.fn(),
    };

    service = new RecordService(repository);
  });

  it('delegates to repository correctly (cursor)', async () => {
    const search: SearchRecordQueryDto = { artist: 'The Beatles' };
    const pagination: CursorPaginationQueryDto = { limit: 3, cursor: null };
    const expectedResponse = {
      data: [],
      limit: 3,
    } as CursorPaginationResponseDto<any>;
    repository.findWithCursorPagination.mockResolvedValue(expectedResponse);

    const response = await service.findWithCursorPagination(search, pagination);
    expect(repository.findWithCursorPagination).toHaveBeenCalledTimes(1);
    const [queryArg, paginationArg] =
      repository.findWithCursorPagination.mock.calls[0];
    expect(queryArg).toMatchObject({ mocked: true });
    expect(paginationArg).toBe(pagination);
    expect(response).toBe(expectedResponse);
  });

  it('delegates to repository correctly (offset)', async () => {
    const search: SearchRecordQueryDto = { album: 'Revolver' };
    const pagination: OffsetPaginationQueryDto = { limit: 5, page: 2 };
    const expectedResponse = {
      data: [],
      page: 2,
      limit: 5,
    } as OffsetPaginationResponseDto<any>;
    repository.findWithOffsetPagination.mockResolvedValue(expectedResponse);

    const response = await service.findWithOffsetPagination(search, pagination);
    expect(repository.findWithOffsetPagination).toHaveBeenCalledTimes(1);
    const [queryArg, paginationArg] =
      repository.findWithOffsetPagination.mock.calls[0];
    expect(queryArg).toMatchObject({ mocked: true });
    expect(paginationArg).toBe(pagination);
    expect(response).toBe(expectedResponse);
  });

  it('applies search builder', async () => {
    const search: SearchRecordQueryDto = { artist: '  Radiohead  ' };
    const pagination: CursorPaginationQueryDto = { limit: 2, cursor: null };
    repository.findWithCursorPagination.mockResolvedValue({
      data: [],
      limit: 2,
    } as CursorPaginationResponseDto<any>);
    await service.findWithCursorPagination(search, pagination);
    expect(buildRecordSearchQuery).toHaveBeenCalledWith(search);
  });

  it('enforces limit by passing through pagination DTO', async () => {
    const search: SearchRecordQueryDto = {};
    const pagination: OffsetPaginationQueryDto = { page: 4, limit: 10 };
    repository.findWithOffsetPagination.mockResolvedValue({
      data: [],
      page: 4,
      limit: 10,
    } as OffsetPaginationResponseDto<any>);
    await service.findWithOffsetPagination(search, pagination);
    expect(repository.findWithOffsetPagination).toHaveBeenCalledWith(
      expect.any(Object),
      pagination,
    );
  });

  it('handles empty results (cursor)', async () => {
    const search: SearchRecordQueryDto = {};
    const pagination: CursorPaginationQueryDto = { limit: 3, cursor: null };
    const emptyResponse = {
      data: [],
      limit: 3,
    } as CursorPaginationResponseDto<any>;
    repository.findWithCursorPagination.mockResolvedValue(emptyResponse);
    const res = await service.findWithCursorPagination(search, pagination);
    expect(res.data).toHaveLength(0);
  });

  it('passes pagination DTOs through (offset)', async () => {
    const search: SearchRecordQueryDto = {};
    const pagination: OffsetPaginationQueryDto = { page: 1, limit: 15 };
    const response = {
      data: [],
      page: 1,
      limit: 15,
    } as OffsetPaginationResponseDto<any>;
    repository.findWithOffsetPagination.mockResolvedValue(response);
    const res = await service.findWithOffsetPagination(search, pagination);
    expect(res.limit).toBe(15);
    expect(res.page).toBe(1);
  });
});
