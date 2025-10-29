import { RecordMongoRepository } from './record.mongo.repository';

import {
  buildMockModel,
  oid,
  TestRecord,
} from './__mocks__/mongo-test-helpers';

import { InvalidCursorException } from '../common/pagination/exceptions/invalid-cursor.exception';
import { InvalidPageException } from '../common/pagination/exceptions/invalid-page.exception';

const MAX_LIMIT = 5;
const paginationCfg = { maxLimit: MAX_LIMIT, defaultLimit: 3 };
const mongodbCfg = { uri: 'mock-uri', queryWarningThresholdMs: 1000 };
const baseDocs = Array.from({ length: 10 }, (_, i) => ({
  _id: oid(i),
  artist: `A${i}`,
})) as TestRecord[];

describe('RecordMongoRepository - cursor pagination', () => {
  let repo: RecordMongoRepository;

  beforeEach(() => {
    repo = new RecordMongoRepository(
      buildMockModel(baseDocs),
      paginationCfg,
      mongodbCfg,
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
      { defaultLimit: LIMIT, maxLimit: LIMIT },
      mongodbCfg,
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
      paginationCfg,
      mongodbCfg,
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
      paginationCfg,
      mongodbCfg,
    );

    const res = await repo.findWithOffsetPagination({}, { page: 1, limit: 5 });

    expect(res.data.map((d) => d._id)).toEqual([oid(1), oid(2), oid(3)]);
  });

  it('handles undefined page and limit values gracefully', async () => {
    const LIMIT = 20;
    repo = new RecordMongoRepository(
      buildMockModel(baseDocs),
      { defaultLimit: LIMIT, maxLimit: LIMIT },
      mongodbCfg,
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
  const paginationCfg2 = { maxLimit: 10, defaultLimit: 5 };
  const mongodbCfg2 = { uri: 'mock', queryWarningThresholdMs: 1_000 };

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
      paginationCfg2,
      mongodbCfg2,
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
      paginationCfg2,
      mongodbCfg2,
    );
    await expect(
      repoErr.findWithOffsetPagination({}, { page: 1, limit: 2 }),
    ).rejects.toThrow(/count failure/);
  });
});
