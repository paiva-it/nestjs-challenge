import { recordCacheKey, searchCacheKey } from './key-builder.util';
import { hash } from '@api/core/utils/hash.utils';

jest.mock('@api/core/utils/hash.utils', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('@test/__mocks__/cache/hash.utils.jest.mock').hashUtilsModule;
});

describe('key-builder.util', () => {
  afterEach(() => jest.clearAllMocks());

  it('builds record cache key with id', () => {
    expect(recordCacheKey('abc')).toBe('record:abc');
  });

  it('builds search cache key using a stable hash of query', () => {
    const key = searchCacheKey({ a: 1, b: 2 });
    expect(hash).toHaveBeenCalledTimes(1);
    expect(key).toBe('record:search:hashed');
  });

  it('stabilizes object order before hashing (integration)', () => {
    (hash as jest.Mock).mockImplementation(
      jest.requireActual('@api/core/utils/hash.utils').hash,
    );
    const unordered = { b: 2, a: 1 } as any;
    const reordered = { a: 1, b: 2 } as any;
    const key1 = searchCacheKey(unordered);
    const key2 = searchCacheKey(reordered);
    expect(key1).toBe(key2);
  });
});
