export function createCacheMock() {
  return {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  } as any;
}
