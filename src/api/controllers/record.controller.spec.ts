import { Test, TestingModule } from '@nestjs/testing';
import { RecordController } from './record.controller';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';
import { RecordService } from '../services/record.service';
import { MockAuthGuard } from '../guards/mock-auth.guard';
import { CursorPaginationResponseDto } from '../common/pagination/dtos/cursor-pagination.response.dto';
import { OffsetPaginationResponseDto } from '../common/pagination/dtos/offset-pagination.response.dto';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Record } from '../schemas/record.schema';
import { RecordAlreadyExistsException } from '../exceptions/record.already-exists.exception';

describe('RecordController', () => {
  let controller: RecordController;
  let service: RecordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecordController],
      providers: [
        {
          provide: RecordService,
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            findWithCursorPagination: jest.fn(),
            findWithOffsetPagination: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RecordController>(RecordController);
    service = module.get<RecordService>(RecordService);
  });

  it('should create a new record', async () => {
    const createRecordDto: CreateRecordRequestDTO = {
      artist: 'Test',
      album: 'Test Record',
      price: 100,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ALTERNATIVE,
    };

    const savedRecord = {
      _id: '1',
      artist: 'Test',
      album: 'Test Record',
      price: 100,
      qty: 10,
      category: RecordCategory.ALTERNATIVE,
      format: RecordFormat.VINYL,
    };
    (service.create as jest.Mock).mockResolvedValue(savedRecord as Record);

    const result = await controller.create(createRecordDto);

    expect(result).toEqual(savedRecord);
    expect(service.create).toHaveBeenCalledWith(createRecordDto);
  });

  it('should update an existing record', async () => {
    const updateDto: UpdateRecordRequestDTO = {
      price: 150,
      qty: 5,
    };
    const updated: Partial<Record> = {
      _id: '1',
      artist: 'Test',
      album: 'Test Record',
      price: 150,
      qty: 5,
      category: RecordCategory.ALTERNATIVE,
      format: RecordFormat.VINYL,
    } as Record;
    (service.update as jest.Mock).mockResolvedValue(updated as Record);
    const result = await controller.update('1', updateDto);
    expect(result).toEqual(updated);
    expect(service.update).toHaveBeenCalledWith('1', updateDto);
  });

  it('propagates conflict error from service on create', async () => {
    const dto: CreateRecordRequestDTO = {
      artist: 'Dup',
      album: 'Dup Album',
      price: 10,
      qty: 1,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    };
    (service.create as jest.Mock).mockRejectedValue(
      new RecordAlreadyExistsException(dto),
    );
    await expect(controller.create(dto)).rejects.toThrow(
      /Record already exists/,
    );
  });

  it('should fetch records using cursor pagination', async () => {
    const mockResponse = new CursorPaginationResponseDto<Record>({
      data: [],
      limit: 10,
    });

    (service.findWithCursorPagination as jest.Mock).mockResolvedValue(
      mockResponse,
    );

    const result = await controller.findWithCursorPagination({}, { limit: 10 });

    expect(result).toEqual(mockResponse);
    expect(service.findWithCursorPagination).toHaveBeenCalledWith(
      {},
      { limit: 10 },
    );
  });

  it('should fetch records using offset pagination', async () => {
    const mockResponse = new OffsetPaginationResponseDto<Record>({
      data: [],
      page: 1,
      totalItems: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
      limit: 10,
      pageSize: 10,
      startIndex: 0,
      endIndex: 0,
      resultsOnPage: 0,
      isFirstPage: true,
      isLastPage: true,
      nextPage: null,
      previousPage: null,
    });

    (service.findWithOffsetPagination as jest.Mock).mockResolvedValue(
      mockResponse,
    );

    const result = await controller.findWithOffsetPagination(
      {},
      { page: 1, limit: 10 },
    );

    expect(result).toEqual(mockResponse);
    expect(service.findWithOffsetPagination).toHaveBeenCalledWith(
      {},
      { page: 1, limit: 10 },
    );
  });

  it('should have MockAuthGuard applied on findWithOffsetPagination', () => {
    const handler = RecordController.prototype.findWithOffsetPagination;

    const metadata = Reflect.getMetadata(GUARDS_METADATA, handler);

    expect(metadata).toBeDefined();
    expect(metadata).toHaveLength(1);
    expect(metadata[0]).toBe(MockAuthGuard);
  });
});
