export function createRedisClientMock() {
  const store = new Map<string, string>();
  return {
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
  };
}

export function createRedisModuleMock() {
  return {
    createClient: jest.fn(() => createRedisClientMock()),
  };
}
