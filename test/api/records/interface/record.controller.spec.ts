import { RecordController } from '@api/records/interface/record.controller';
import { RecordServicePort } from '@api/records/domain/ports/record.service.port';
import { createRecordServicePortMock } from '@test/__mocks__/domain/record.service.port.mock';
import { CreateRecordRequestDTO } from '@api/records/application/dtos/create-record.request.dto';
import { UpdateRecordRequestDTO } from '@api/records/application/dtos/update-record.request.dto';
import { CursorPaginationQueryDto } from '@api/core/pagination/dtos/cursor-pagination.query.dto';
import { OffsetPaginationQueryDto } from '@api/core/pagination/dtos/offset-pagination.query.dto';
import { SearchRecordQueryDto } from '@api/records/application/dtos/search-record.query.dto';

describe('RecordController', () => {
  let controller: RecordController;
  let serviceMock: ReturnType<typeof createRecordServicePortMock>;

  beforeEach(() => {
    serviceMock = createRecordServicePortMock();
    controller = new RecordController(serviceMock as any as RecordServicePort);
  });

  it('create delegates to service', async () => {
    const dto: CreateRecordRequestDTO = {
      artist: 'A',
      album: 'B',
      price: 10,
      qty: 2,
      format: 'VINYL' as any,
      category: 'ROCK' as any,
    };
    const result = await controller.create(dto);
    expect(serviceMock.create).toHaveBeenCalledWith(dto);
    expect(result).toMatchObject({ id: 'record-id', artist: 'A' });
  });

  it('update delegates to service', async () => {
    const dto: UpdateRecordRequestDTO = {
      artist: 'A2',
      album: 'B2',
      price: 11,
      qty: 3,
      format: 'VINYL' as any,
      category: 'ROCK' as any,
    };
    const result = await controller.update('id-1', dto);
    expect(serviceMock.update).toHaveBeenCalledWith('id-1', dto);
    expect(result).toMatchObject({ id: 'id-1', artist: 'A2' });
  });

  it('findWithCursorPagination delegates to service', async () => {
    const query: SearchRecordQueryDto = {} as any;
    const pagination: CursorPaginationQueryDto = {
      cursor: null,
      limit: 10,
    } as any;
    const result = await controller.findWithCursorPagination(query, pagination);
    expect(serviceMock.findWithCursorPagination).toHaveBeenCalledWith(
      query,
      pagination,
    );
    expect(result.data).toEqual([]);
  });

  it('findWithOffsetPagination delegates to service', async () => {
    const query: SearchRecordQueryDto = {} as any;
    const pagination: OffsetPaginationQueryDto = {
      page: 1,
      pageSize: 10,
    } as any;
    const result = await controller.findWithOffsetPagination(query, pagination);
    expect(serviceMock.findWithOffsetPagination).toHaveBeenCalledWith(
      query,
      pagination,
    );
    expect(result.data).toEqual([]);
  });
});
