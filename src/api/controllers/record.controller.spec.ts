import { Test, TestingModule } from '@nestjs/testing';
import { RecordController } from './record.controller';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Record } from '../schemas/record.schema';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';
import { RecordService } from '../services/record.service';
import { MockAuthGuard } from '../guards/mock-auth.guard';
import { CursorPaginationResponseDto } from '../common/pagination/dtos/cursor-pagination.response.dto';
import { OffsetPaginationResponseDto } from '../common/pagination/dtos/offset-pagination.response.dto';
import { GUARDS_METADATA } from '@nestjs/common/constants';

describe('RecordController', () => {
  let controller: RecordController;
  let recordModel: Model<Record>;
  let service: RecordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecordController],
      providers: [
        {
          provide: getModelToken('Record'),
          useValue: {
            new: jest.fn().mockResolvedValue({}),
            constructor: jest.fn().mockResolvedValue({}),
            find: jest.fn(),
            findById: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: RecordService,
          useValue: {
            findWithCursorPagination: jest.fn(),
            findWithOffsetPagination: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RecordController>(RecordController);
    recordModel = module.get<Model<Record>>(getModelToken('Record'));
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
    };

    jest.spyOn(recordModel, 'create').mockResolvedValue(savedRecord as any);

    const result = await controller.create(createRecordDto);

    expect(result).toEqual(savedRecord);
    expect(recordModel.create).toHaveBeenCalledWith({
      artist: 'Test',
      album: 'Test Record',
      price: 100,
      qty: 10,
      category: RecordCategory.ALTERNATIVE,
      format: RecordFormat.VINYL,
      mbid: undefined,
      searchTokens: expect.any(Array),
    });
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
