export function createTokenServiceMock() {
  return {
    generate: jest.fn().mockReturnValue(['tok1', 'tok2']),
    needsRecompute: jest.fn().mockReturnValue(false),
  } as any;
}
