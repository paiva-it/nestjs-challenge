import { RedisCacheAdapter } from './redis-cache.adapter';
import { Logger } from '@nestjs/common';

jest.mock('redis', () => {
  const store = new Map<string, string>();
  return {
    createClient: jest.fn(() => ({
      connect: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(async (key: string) => store.get(key) ?? null),
      set: jest.fn(async (key: string, val: string) => {
        store.set(key, val);
        return 'OK';
      }),
      del: jest.fn(async (key: string) => {
        store.delete(key);
        return 1;
      }),
    })),
  };
});

describe('RedisCacheAdapter', () => {
  const config = { host: 'localhost', port: 6379, ttl: 42 } as any;
  let adapter: RedisCacheAdapter;

  beforeEach(() => {
    adapter = new RedisCacheAdapter(config);
  });

  it('sets and gets values (JSON serialization)', async () => {
    await adapter.set('k1', { a: 1 }, 10);
    const val = await adapter.get<{ a: number }>('k1');
    expect(val).toEqual({ a: 1 });
  });

  it('returns null for missing key', async () => {
    const val = await adapter.get('unknown');
    expect(val).toBeNull();
  });

  it('uses default ttl when not provided', async () => {
    const spy = jest.spyOn((adapter as any).client, 'set');
    await adapter.set('k2', 'value');
    expect(spy).toHaveBeenCalledWith('k2', JSON.stringify('value'), {
      EX: config.ttl,
    });
  });

  it('deletes keys', async () => {
    await adapter.set('k3', 123, 5);
    await adapter.delete('k3');
    const val = await adapter.get('k3');
    expect(val).toBeNull();
  });

  it('logs connection error', async () => {
    const mockedCreate = jest.requireMock('redis').createClient as jest.Mock;
    mockedCreate.mockImplementationOnce(() => ({
      connect: jest.fn().mockRejectedValue(new Error('conn')),
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    }));
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    new RedisCacheAdapter(config);
    await new Promise((res) => setImmediate(res));
    await new Promise((res) => setTimeout(res, 0));
    expect(errorSpy).toHaveBeenCalledWith(
      'Redis connection failed',
      expect.any(Error),
    );
  });
});
