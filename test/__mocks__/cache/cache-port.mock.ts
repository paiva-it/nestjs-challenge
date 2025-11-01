import { CachePort } from '@api/core/cache/cache.port';

export function createCachePortMock(): jest.Mocked<CachePort> {
  return {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  } as any;
}
