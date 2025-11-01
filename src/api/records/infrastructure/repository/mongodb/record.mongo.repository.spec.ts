import { RecordMongoRepository } from './record.mongo.repository';
import { Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { RecordMongoMapper } from './mappers/record.mongo.mapper';
import { createMongooseModelMock } from '@test/__mocks__/db/mongoose.model.mock';
import { createTokenServiceMock } from '@test/__mocks__/external/token.service.mock';
import { createCacheMock } from '@test/__mocks__/cache/cache.mock';
import {
  RecordFormat,
  RecordCategory,
} from '@api/records/domain/entities/record.enum';

describe('RecordMongoRepository', () => {
  let repository: RecordMongoRepository;
  let model: ReturnType<typeof createMongooseModelMock>;
  let tokenService: ReturnType<typeof createTokenServiceMock>;
  let cache: ReturnType<typeof createCacheMock>;

  const mongodbConfig = { queryWarningThresholdMs: 9999 };
  const pagination = { defaultLimit: 5, maxLimit: 50 };

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  beforeEach(() => {
    model = createMongooseModelMock();
    tokenService = createTokenServiceMock();
    cache = createCacheMock();

    repository = new RecordMongoRepository(
      model as any,
      tokenService,
      cache,
      mongodbConfig as any,
      pagination as any,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ----------------------------------
  // CREATE
  // ----------------------------------
  it('creates and maps record', async () => {
    const fakeDoc = {
      _id: 'id123',
      artist: 'Artist',
      album: 'Album',
      price: 10,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
      tracklist: [],
      created: new Date(),
      lastModified: new Date(),
    };

    model.create.mockResolvedValue(fakeDoc);

    const mapperSpy = jest
      .spyOn(RecordMongoMapper.prototype, 'toEntity')
      .mockReturnValue({
        id: 'id123',
        artist: 'Artist',
        album: 'Album',
        price: 10,
        qty: 10,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
        tracklist: [],
        created: fakeDoc.created,
        lastModified: fakeDoc.lastModified,
      });

    const payload = {
      artist: 'Artist',
      album: 'Album',
      price: 10,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
      tracklist: [],
    };

    const result = await repository.create(payload);

    expect(model.create).toHaveBeenCalledWith({
      ...payload,
      searchTokens: ['tok1', 'tok2'],
    });

    expect(mapperSpy).toHaveBeenCalledWith(fakeDoc);
    expect(result).toEqual({
      id: 'id123',
      artist: 'Artist',
      album: 'Album',
      price: 10,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
      tracklist: [],
      created: fakeDoc.created,
      lastModified: fakeDoc.lastModified,
    });
  });

  it('throws RecordAlreadyExistsException on duplicate key', async () => {
    const error = new Error();
    (error as any).code = 11000;
    model.create.mockRejectedValue(error);

    await expect(
      repository.create({
        artist: 'A',
        album: 'B',
        price: 1,
        qty: 1,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
        tracklist: [],
      }),
    ).rejects.toMatchObject({ name: 'RecordAlreadyExistsException' });
  });

  // ----------------------------------
  // UPDATE
  // ----------------------------------
  it('updates record and maps', async () => {
    const created = new Date();
    const lastModified = new Date();
    const found: any = {
      set: jest.fn(),
      modifiedPaths: jest.fn().mockReturnValue([]),
      toObject: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue({
        _id: 'id123',
        artist: 'Artist',
        album: 'Album',
        price: 10,
        qty: 5,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
        tracklist: [],
        created,
        lastModified,
      }),
    };
    model.findById.mockResolvedValue(found);

    const mapperSpy = jest
      .spyOn(RecordMongoMapper.prototype, 'toEntity')
      .mockReturnValue({
        id: 'id123',
        artist: 'Artist',
        album: 'Album',
        price: 10,
        qty: 5,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
        tracklist: [],
        created: new Date(),
        lastModified: new Date(),
      });

    const result = await repository.update('id123', { qty: 5 });

    expect(found.set).toHaveBeenCalledWith({ qty: 5 });
    expect(result).toEqual({
      id: 'id123',
      artist: 'Artist',
      album: 'Album',
      price: 10,
      qty: 5,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
      tracklist: [],
      created: expect.any(Date),
      lastModified: expect.any(Date),
    });
    expect(mapperSpy).toHaveBeenCalled();
  });

  it('throws NotFoundException if update target missing', async () => {
    model.findById.mockResolvedValue(null);

    await expect(repository.update('id123', {})).rejects.toThrow(
      NotFoundException,
    );
  });

  // ----------------------------------
  // FIND BY ID
  // ----------------------------------
  it('findById returns mapped entity', async () => {
    const doc = { _id: 'id123', qty: 1 };

    model.findById.mockReturnValue({
      lean: () => ({ exec: async () => doc }),
    });

    const mapperSpy = jest
      .spyOn(RecordMongoMapper.prototype, 'toEntity')
      .mockReturnValue({
        id: 'id123',
        artist: 'Artist',
        album: 'Album',
        price: 10,
        qty: 1,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
        tracklist: [],
        created: new Date(),
        lastModified: new Date(),
      });

    const result = await repository.findById('id123');

    expect(result).toEqual({
      id: 'id123',
      artist: 'Artist',
      album: 'Album',
      price: 10,
      qty: 1,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
      tracklist: [],
      created: expect.any(Date),
      lastModified: expect.any(Date),
    });
    expect(mapperSpy).toHaveBeenCalledWith(doc);
  });

  it('throws NotFoundException on findById missing', async () => {
    model.findById.mockReturnValue({
      lean: () => ({ exec: async () => null }),
    });

    await expect(repository.findById('nope')).rejects.toThrow(
      NotFoundException,
    );
  });

  // ----------------------------------
  // DECREASE QUANTITY
  // ----------------------------------
  it('throws BadRequestException on invalid qty', async () => {
    await expect(repository.decreaseQuantity('id', 0)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws NotFoundException if doc missing for decrease', async () => {
    model.findOneAndUpdate.mockResolvedValue(null);
    model.findById.mockResolvedValue(null);

    await expect(repository.decreaseQuantity('id', 1)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('maps updated doc on decreaseQuantity success', async () => {
    const fakeDoc = {
      _id: 'id123',
      artist: 'Artist',
      album: 'Album',
      price: 10,
      qty: 9,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
      tracklist: [],
      created: new Date(),
      lastModified: new Date(),
    };

    model.findOneAndUpdate.mockResolvedValue(fakeDoc);

    const mapperSpy = jest
      .spyOn(RecordMongoMapper.prototype, 'toEntity')
      .mockReturnValue({
        id: 'id123',
        artist: 'Artist',
        album: 'Album',
        price: 10,
        qty: 9,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
        tracklist: [],
        created: fakeDoc.created,
        lastModified: fakeDoc.lastModified,
      });

    const result = await repository.decreaseQuantity('id123', 1);

    expect(mapperSpy).toHaveBeenCalledWith(fakeDoc);
    expect(result).toEqual({
      id: 'id123',
      artist: 'Artist',
      album: 'Album',
      price: 10,
      qty: 9,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
      tracklist: [],
      created: expect.any(Date),
      lastModified: expect.any(Date),
    });
  });
});
