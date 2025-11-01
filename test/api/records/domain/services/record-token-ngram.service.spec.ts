import { RecordTokenNgramService } from '@api/records/domain/services/record-token-ngram.service';

function buildDoc(overrides: any = {}) {
  return {
    artist: 'Art',
    album: 'Alb',
    category: 'ROCK',
    format: 'VINYL',
    ...overrides,
  } as any;
}

describe('RecordTokenNgramService', () => {
  let service: RecordTokenNgramService;

  beforeEach(() => {
    service = new RecordTokenNgramService();
  });

  it('needsRecompute positive when token field modified', () => {
    expect(service.needsRecompute(['artist'])).toBe(true);
  });

  it('needsRecompute negative when none modified', () => {
    expect(service.needsRecompute(['qty'])).toBe(false);
  });

  it('generate returns distinct ngrams for fields', () => {
    const tokens = service.generate(buildDoc());
    expect(tokens.length).toBeGreaterThan(0);
    const unique = new Set(tokens);
    expect(unique.size).toEqual(tokens.length);
  });

  it('generate throws when field not string', () => {
    expect(() => service.generate(buildDoc({ artist: 123 }))).toThrow(
      /must be a string/,
    );
  });
});
