import { RecordMongoRepository } from './record.mongo.repository';
import { RecordTokenServicePort } from '../ports/record-token.service.port';
import { RecordFormat, RecordCategory } from '../schemas/record.enum';
import { Record } from '../schemas/record.schema';
import { Logger } from '@nestjs/common';

import {
  buildMockModel,
  oid,
  TestRecord,
  buildModelForCreate,
  buildModelForCreateWithError,
  buildModelForUpdate,
  buildMockTokenService,
  buildSession,
} from './__mocks__/mongo-test-helpers';
import { InvalidCursorException } from '../../common/pagination/exceptions/invalid-cursor.exception';
import { InvalidPageException } from '../../common/pagination/exceptions/invalid-page.exception';

const MAX_LIMIT = 5;
const paginationCfg = { maxLimit: MAX_LIMIT, defaultLimit: 3 };
const mongodbCfg = { uri: 'mock-uri', queryWarningThresholdMs: 1000 };

const mockTokenServiceGlobal: RecordTokenServicePort = {
  needsRecompute: (paths) =>
    paths.some((p) => ['artist', 'album', 'category', 'format'].includes(p)),
  generate: (doc: object) => {
    const r = doc as Partial<Record>;
    const raw = [r.artist, r.album, r.category, r.format]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return raw ? raw.split(/\s+/) : [];
  },
};

const baseDocs: TestRecord[] = Array.from({ length: 10 }, (_, i) => ({
  _id: oid(i),
  artist: `A${i}`,
})) as TestRecord[];

describe('RecordMongoRepository - create & update', () => {
  const paginationCfgLocal = { maxLimit: 50, defaultLimit: 10 };
  const mongodbCfgLocal = { uri: 'mock', queryWarningThresholdMs: 1000 };

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  const mockTokenService: RecordTokenServicePort = buildMockTokenService();

  beforeEach(() => {
    (mockTokenService.generate as jest.Mock).mockClear();
  });

  it('computes searchTokens on create', async () => {
    const model = buildModelForCreate();
    const repo = new RecordMongoRepository(
      model,
      mongodbCfgLocal,
      paginationCfgLocal,
      mockTokenService,
    );
    const created = await repo.create({
      artist: 'Pink Floyd',
      album: 'The Wall',
      price: 25.99,
      qty: 10,
      category: RecordCategory.ROCK,
      format: RecordFormat.VINYL,
    });
    expect(created.searchTokens).toBeDefined();
    expect(Array.isArray(created.searchTokens)).toBe(true);
    expect(created.searchTokens.length).toBeGreaterThan(0);
    expect(model).toHaveBeenCalledWith(
      expect.objectContaining({ searchTokens: expect.any(Array) }),
    );
  });

  it('recomputes tokens only when relevant fields change', async () => {
    const { model, doc } = buildModelForUpdate(
      {
        _id: oid(100),
        artist: 'Led Zeppelin',
        album: 'IV',
        category: RecordCategory.ROCK,
        format: RecordFormat.VINYL,
        searchTokens: ['led', 'zeppelin', 'iv'],
      },
      ['qty'],
    );
    const repo = new RecordMongoRepository(
      model,
      mongodbCfgLocal,
      paginationCfgLocal,
      mockTokenService,
    );
    const updated = await repo.update(doc._id.toString(), { qty: 50 });
    expect(updated.qty).toBe(50);
    expect(updated.searchTokens).toEqual(['led', 'zeppelin', 'iv']);
    expect(mockTokenService.generate).not.toHaveBeenCalled();
  });

  it('recomputes tokens when artist changes', async () => {
    const { model, doc } = buildModelForUpdate(
      {
        _id: oid(101),
        artist: 'Led Zeppelin',
        album: 'IV',
        category: RecordCategory.ROCK,
        format: RecordFormat.VINYL,
        searchTokens: ['led', 'zeppelin', 'iv'],
      },
      ['artist'],
    );
    const repo = new RecordMongoRepository(
      model,
      mongodbCfgLocal,
      paginationCfgLocal,
      mockTokenService,
    );
    const updated = await repo.update(doc._id.toString(), {
      artist: 'Zeppelin',
    });
    expect(updated.artist).toBe('Zeppelin');
    expect(updated.searchTokens).toBeDefined();
    expect(mockTokenService.generate).toHaveBeenCalled();
  });

  it('recomputes tokens when album changes', async () => {
    const { model, doc } = buildModelForUpdate(
      {
        _id: oid(102),
        artist: 'Artist',
        album: 'Old Album',
        category: RecordCategory.ROCK,
        format: RecordFormat.VINYL,
        searchTokens: ['artist', 'old', 'album'],
      },
      ['album'],
    );
    const repo = new RecordMongoRepository(
      model,
      mongodbCfgLocal,
      paginationCfgLocal,
      mockTokenService,
    );
    const updated = await repo.update(doc._id.toString(), {
      album: 'New Album',
    });
    expect(updated.album).toBe('New Album');
    expect(updated.searchTokens).toBeDefined();
    expect(mockTokenService.generate).toHaveBeenCalled();
  });

  it('recomputes tokens when category changes', async () => {
    const { model, doc } = buildModelForUpdate(
      {
        _id: oid(103),
        artist: 'Artist',
        album: 'Album',
        category: RecordCategory.ROCK,
        format: RecordFormat.VINYL,
        searchTokens: ['artist', 'album', 'rock'],
      },
      ['category'],
    );
    const repo = new RecordMongoRepository(
      model,
      mongodbCfgLocal,
      paginationCfgLocal,
      mockTokenService,
    );
    const updated = await repo.update(doc._id.toString(), {
      category: RecordCategory.JAZZ,
    });
    expect(updated.category).toBe(RecordCategory.JAZZ);
    expect(updated.searchTokens).toBeDefined();
    expect(mockTokenService.generate).toHaveBeenCalled();
  });

  it('recomputes tokens when format changes', async () => {
    const { model, doc } = buildModelForUpdate(
      {
        _id: oid(104),
        artist: 'Artist',
        album: 'Album',
        category: RecordCategory.ROCK,
        format: RecordFormat.VINYL,
        searchTokens: ['artist', 'album', 'rock', 'vinyl'],
      },
      ['format'],
    );
    const repo = new RecordMongoRepository(
      model,
      mongodbCfgLocal,
      paginationCfgLocal,
      mockTokenService,
    );
    const updated = await repo.update(doc._id.toString(), {
      format: RecordFormat.CD,
    });
    expect(updated.format).toBe(RecordFormat.CD);
    expect(updated.searchTokens).toBeDefined();
    expect(mockTokenService.generate).toHaveBeenCalled();
  });

  it('throws ConflictException on duplicate create (code 11000)', async () => {
    const duplicateError = { code: 11000 };
    const model = buildModelForCreateWithError(duplicateError);
    const repo = new RecordMongoRepository(
      model,
      mongodbCfgLocal,
      paginationCfgLocal,
      mockTokenService,
    );
    await expect(
      repo.create({
        artist: 'A',
        album: 'B',
        price: 10.0,
        qty: 1,
        category: RecordCategory.ROCK,
        format: RecordFormat.VINYL,
      }),
    ).rejects.toThrow(/Record already exists/);
  });

  it('propagates non-duplicate error on create', async () => {
    const originalError = new Error('unexpected write failure');
    (originalError as any).code = 42;
    const model = buildModelForCreateWithError(originalError);
    const repo = new RecordMongoRepository(
      model,
      mongodbCfgLocal,
      paginationCfgLocal,
      mockTokenService,
    );
    await expect(
      repo.create({
        artist: 'Err',
        album: 'Fail',
        price: 15.0,
        qty: 5,
        category: RecordCategory.ROCK,
        format: RecordFormat.VINYL,
      }),
    ).rejects.toThrow(/unexpected write failure/);
    try {
      await repo.create({
        artist: 'Err',
        album: 'Fail',
        price: 15.0,
        qty: 5,
        category: RecordCategory.ROCK,
        format: RecordFormat.VINYL,
      });
    } catch (e: any) {
      expect(e.message).toBe('unexpected write failure');
      expect(e.constructor.name).not.toBe('RecordAlreadyExistsException');
    }
  });

  it('throws NotFoundException when updating missing record', async () => {
    const session = buildSession();
    const model = {
      startSession: jest.fn().mockResolvedValue(session),
      findById: jest.fn().mockReturnValue({ session: () => null }),
    } as any;
    const repo = new RecordMongoRepository(
      model,
      mongodbCfgLocal,
      paginationCfgLocal,
      mockTokenService,
    );
    await expect(
      repo.update('deadbeefdeadbeefdeadbeef', { qty: 1 }),
    ).rejects.toThrow(/Record not found/);
  });

  it('throws ConflictException when update hits unique constraint (code 11000)', async () => {
    const existing = {
      _id: oid(105),
      artist: 'Artist',
      album: 'Album',
      category: RecordCategory.ROCK,
      format: RecordFormat.VINYL,
      searchTokens: ['artist', 'album', 'rock', 'vinyl'],
    };
    const session = buildSession();
    const doc = {
      ...existing,
      set: jest.fn(),
      modifiedPaths: jest.fn(() => ['artist']),
      toObject: jest.fn(() => existing),
      save: jest.fn(async () => {
        const error: any = new Error('duplicate');
        error.code = 11000;
        throw error;
      }),
    };
    const model = {
      startSession: jest.fn().mockResolvedValue(session),
      findById: jest.fn().mockReturnValue({ session: () => doc }),
    } as any;
    const repo = new RecordMongoRepository(
      model,
      mongodbCfgLocal,
      paginationCfgLocal,
      mockTokenService,
    );
    await expect(
      repo.update(existing._id.toString(), { artist: 'Artist' }),
    ).rejects.toThrow(/Record already exists/);
    expect(session.abortTransaction).toHaveBeenCalled();
  });
});

describe('RecordMongoRepository - cursor pagination', () => {
  let repo: RecordMongoRepository;

  beforeEach(() => {
    repo = new RecordMongoRepository(
      buildMockModel(baseDocs),
      mongodbCfg,
      paginationCfg,
      mockTokenServiceGlobal,
    );
  });

  it('returns the correct number of items', async () => {
    const res = await repo.findWithCursorPagination(
      {},
      { limit: 3, cursor: null },
    );

    expect(res.data).toHaveLength(3);
    expect(res.limit).toBe(3);
  });

  it('includes nextCursor when extra docs exist', async () => {
    const res = await repo.findWithCursorPagination(
      {},
      { limit: 4, cursor: null },
    );

    expect(res.hasNextPage).toBe(true);
    expect(res.nextCursor).toBeDefined();
  });

  it('returns startCursor and endCursor', async () => {
    const res = await repo.findWithCursorPagination(
      {},
      { limit: 2, cursor: null },
    );

    expect(res.startCursor).toBeDefined();
    expect(res.endCursor).toBeDefined();
    expect(res.startCursor).not.toEqual(res.endCursor);
  });

  it('rejects invalid cursor ObjectIds', async () => {
    await expect(
      repo.findWithCursorPagination({}, { limit: 2, cursor: 'invalid' }),
    ).rejects.toThrow(InvalidCursorException);
  });

  it('handles limit value gracefully', async () => {
    const LIMIT = 20;
    repo = new RecordMongoRepository(
      buildMockModel(baseDocs),
      mongodbCfg,
      { defaultLimit: LIMIT, maxLimit: LIMIT },
      mockTokenServiceGlobal,
    );

    const res = await repo.findWithCursorPagination({}, {});

    expect(res.data).toHaveLength(Math.min(baseDocs.length, LIMIT));
    expect(res.limit).toEqual(LIMIT);
  });

  it('respects maxLimit config', async () => {
    await expect(
      repo.findWithCursorPagination({}, { limit: MAX_LIMIT + 1, cursor: null }),
    ).rejects.toThrow();
  });
});

describe('RecordMongoRepository - offset pagination', () => {
  let repo: RecordMongoRepository;

  beforeEach(() => {
    repo = new RecordMongoRepository(
      buildMockModel(baseDocs),
      mongodbCfg,
      paginationCfg,
      mockTokenServiceGlobal,
    );
  });

  it('returns correct subset', async () => {
    const res = await repo.findWithOffsetPagination({}, { page: 2, limit: 4 });

    expect(res.data.map((d) => d._id)).toEqual([
      oid(4),
      oid(5),
      oid(6),
      oid(7),
    ]);
  });

  it('computes totals and totalPages correctly', async () => {
    const res = await repo.findWithOffsetPagination({}, { page: 1, limit: 5 });

    expect(res.totalItems).toBe(baseDocs.length);
    expect(res.totalPages).toBe(Math.ceil(baseDocs.length / 5));
  });

  it('returns correct pagination metadata', async () => {
    const res = await repo.findWithOffsetPagination({}, { page: 1, limit: 5 });

    expect(res.isFirstPage).toBe(true);
    expect(res.hasNextPage).toBe(true);
    expect(res.nextPage).toBe(2);
  });

  it('throws on negative page values', async () => {
    await expect(
      repo.findWithOffsetPagination({}, { page: -1, limit: 5 }),
    ).rejects.toThrow(InvalidPageException);
  });

  it('sorts consistently by _id', async () => {
    const docs: TestRecord[] = [oid(3), oid(1), oid(2)].map(
      (id, i) => ({ _id: id, artist: `X${i}` }) as TestRecord,
    );

    repo = new RecordMongoRepository(
      buildMockModel(docs),
      mongodbCfg,
      paginationCfg,
      mockTokenServiceGlobal,
    );

    const res = await repo.findWithOffsetPagination({}, { page: 1, limit: 5 });

    expect(res.data.map((d) => d._id)).toEqual([oid(1), oid(2), oid(3)]);
  });

  it('handles undefined page and limit values gracefully', async () => {
    const LIMIT = 20;
    repo = new RecordMongoRepository(
      buildMockModel(baseDocs),
      mongodbCfg,
      { defaultLimit: LIMIT, maxLimit: LIMIT },
      mockTokenServiceGlobal,
    );

    const res = await repo.findWithOffsetPagination({}, {});

    expect(res.data).toHaveLength(Math.min(baseDocs.length, LIMIT));
    expect(res.limit).toEqual(LIMIT);
    expect(res.page).toEqual(1);
  });

  it('respects maxLimit config', async () => {
    await expect(
      repo.findWithOffsetPagination({}, { page: 1, limit: MAX_LIMIT + 1 }),
    ).rejects.toThrow();
  });
});

describe('error handling (Promise.allSettled)', () => {
  it('throws InternalServerErrorException when itemsResult rejects', async () => {
    const errorModel = {
      find: () => ({
        sort: () => ({
          skip: () => ({
            limit: () => ({
              lean: () => ({
                exec: async () => {
                  throw new Error('items failure');
                },
              }),
            }),
          }),
        }),
      }),
      countDocuments: () => ({ exec: async () => 0 }),
    } as any;
    const repoErr = new RecordMongoRepository(
      errorModel,
      mongodbCfg,
      paginationCfg,
      mockTokenServiceGlobal,
    );
    await expect(
      repoErr.findWithOffsetPagination({}, { page: 1, limit: 2 }),
    ).rejects.toThrow(/items failure/);
  });

  it('throws InternalServerErrorException when totalResult rejects', async () => {
    const errorModel = {
      find: () => ({
        sort: () => ({
          skip: () => ({
            limit: () => ({
              lean: () => ({
                exec: async () => [{ _id: oid(1), artist: 'A' }],
              }),
            }),
          }),
        }),
      }),
      countDocuments: () => ({
        exec: async () => {
          throw new Error('count failure');
        },
      }),
    } as any;
    const repoErr = new RecordMongoRepository(
      errorModel,
      mongodbCfg,
      paginationCfg,
      mockTokenServiceGlobal,
    );
    await expect(
      repoErr.findWithOffsetPagination({}, { page: 1, limit: 2 }),
    ).rejects.toThrow(/count failure/);
  });
});
