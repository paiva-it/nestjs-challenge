import { RecordTokenNgramService } from './record-token-ngram.service';
import { RecordFormat, RecordCategory } from '../schemas/record.enum';

describe('RecordTokenNgramService', () => {
  let service: RecordTokenNgramService;

  beforeEach(() => {
    service = new RecordTokenNgramService();
  });

  describe('needsRecompute', () => {
    it('returns true when artist modified', () => {
      expect(service.needsRecompute(['artist'])).toBe(true);
    });

    it('returns true when any token field modified among others', () => {
      expect(
        service.needsRecompute(['qty', 'price', 'format', 'lastModified']),
      ).toBe(true);
    });

    it('returns false when only non-token fields modified', () => {
      expect(service.needsRecompute(['price', 'qty', 'mbid'])).toBe(false);
    });

    it('returns false for empty modified paths', () => {
      expect(service.needsRecompute([])).toBe(false);
    });
  });

  describe('generate', () => {
    it('generates unique ngram tokens across fields', () => {
      const tokens = service.generate({
        artist: 'Pink Floyd',
        album: 'The Wall',
        category: RecordCategory.ROCK,
        format: RecordFormat.VINYL,
      });
      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens).toContain('pink');
      expect(tokens).toContain('floyd');
      expect(tokens).toContain('wall');
      expect(tokens).toContain('rock');
      expect(tokens).toContain('vinyl');
      const dedup = new Set(tokens);
      expect(dedup.size).toBe(tokens.length);
    });

    it('ignores undefined fields gracefully', () => {
      const tokens = service.generate({ artist: 'Radiohead' });
      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens).toContain('radiohead');
    });

    it('returns empty array when all token fields absent', () => {
      const tokens = service.generate({ qty: 5, price: 10 });
      expect(tokens).toEqual([]);
    });

    it('is deterministic for same input', () => {
      const input = {
        artist: 'Led Zeppelin',
        album: 'IV',
        category: RecordCategory.ROCK,
        format: RecordFormat.VINYL,
      };
      const a = service.generate(input);
      const b = service.generate(input);
      expect(a).toEqual(b);
    });
  });
});

test('RecordTokenNgramService instantiates', () => {
  expect(new RecordTokenNgramService()).toBeInstanceOf(RecordTokenNgramService);
});
