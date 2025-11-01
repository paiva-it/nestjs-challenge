export function createRecordTracklistServicePortMock() {
  return {
    shouldUpdate: jest.fn().mockReturnValue(false),
    getTracklist: jest.fn(async () => ['A', 'B']),
  } as any;
}
