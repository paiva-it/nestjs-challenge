import { OffsetSearchCacheUtil } from './offset-search-cache.util';
import { CachePort } from '@api/core/cache/cache.port';
import { Logger } from '@nestjs/common';

describe('OffsetSearchCacheUtil', () => {
  const cache: jest.Mocked<CachePort> = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  } as any;
  const findById = jest.fn();
  const util = new OffsetSearchCacheUtil(cache, findById);
  const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns hydrated pagination response (happy path)', async () => {
    cache.get.mockResolvedValue(['id1', 'id2', 'id3']);
    findById
      .mockResolvedValueOnce({ id: 'id2' })
      .mockResolvedValueOnce({ id: 'id3' });
    const res = await util.get(
      { category: 'x' } as any,
      { limit: 2, page: 2 },
      1,
    );
    expect(res).toMatchObject({
      data: [{ id: 'id2' }, { id: 'id3' }],
      totalItems: 3,
      page: 2,
      limit: 2,
    });
    expect(cache.get).toHaveBeenCalled();
  });

  it('logs and returns null when hydration fails', async () => {
    cache.get.mockResolvedValue(['id1', 'id2']);
    findById
      .mockResolvedValueOnce({ id: 'id1' })
      .mockRejectedValueOnce(new Error('fail'));
    const res = await util.get({ any: 1 } as any, { limit: 2, page: 1 }, 0);
    expect(res).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('logs and returns null on cache get error', async () => {
    cache.get.mockRejectedValue(new Error('boom'));
    const res = await util.get({ a: 1 } as any, { limit: 1, page: 1 }, 0);
    expect(res).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('sets ids with TTL', async () => {
    cache.set.mockResolvedValue();
    await util.set({ a: 1 } as any, ['id1', 'id2']);
    expect(cache.set).toHaveBeenCalledWith(
      expect.any(String),
      ['id1', 'id2'],
      expect.any(Number),
    );
  });

  it('logs on set error', async () => {
    cache.set.mockRejectedValue(new Error('fail'));
    await util.set({ a: 1 } as any, ['id']);
    expect(warnSpy).toHaveBeenCalled();
  });
});
