import { CursorSearchCacheUtil } from './cursor-search-cache.util';
import { Logger } from '@nestjs/common';
import { createCachePortMock } from '@test/__mocks__/cache/cache-port.mock';

describe('CursorSearchCacheUtil', () => {
  const cache = createCachePortMock();
  const findById = jest.fn();
  const util = new CursorSearchCacheUtil(cache, findById);
  const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

  afterEach(() => jest.clearAllMocks());

  it('returns hydrated cursor pagination response (happy path)', async () => {
    cache.get.mockResolvedValue(['id1', 'id2', 'id3']);
    findById
      .mockResolvedValueOnce({ id: 'id1' })
      .mockResolvedValueOnce({ id: 'id2' })
      .mockResolvedValueOnce({ id: 'id3' });
    const res = await util.get({ category: 'x' } as any, {
      limit: 2,
      cursor: undefined,
    });
    expect(res).toMatchObject({
      data: [{ id: 'id1' }, { id: 'id2' }],
      nextCursor: 'id2',
      limit: 2,
    });
  });

  it('starts after provided cursor', async () => {
    cache.get.mockResolvedValue(['id1', 'id2', 'id3']);
    findById
      .mockResolvedValueOnce({ id: 'id2' })
      .mockResolvedValueOnce({ id: 'id3' });
    const res = await util.get({ x: 1 } as any, { limit: 2, cursor: 'id1' });
    expect(res?.data.map((i: any) => i.id)).toEqual(['id2', 'id3']);
  });

  it('returns null if cursor not found', async () => {
    cache.get.mockResolvedValue(['id1']);
    const res = await util.get({ x: 1 } as any, {
      limit: 1,
      cursor: 'missing',
    });
    expect(res).toBeNull();
  });

  it('logs and returns null when hydration fails', async () => {
    cache.get.mockResolvedValue(['id1', 'id2']);
    findById
      .mockResolvedValueOnce({ id: 'id1' })
      .mockRejectedValueOnce(new Error('fail'));
    const res = await util.get({ any: 1 } as any, {
      limit: 2,
      cursor: undefined,
    });
    expect(res).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('logs and returns null on cache get error', async () => {
    cache.get.mockRejectedValue(new Error('boom'));
    const res = await util.get({ a: 1 } as any, {
      limit: 1,
      cursor: undefined,
    });
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
