import { normalizeString } from './normalize-string.util';

describe('normalizeString', () => {
  it('returns lowercased string', () => {
    expect(normalizeString('Hello WORLD')).toBe('hello world');
  });

  it('collapses multiple spaces into one', () => {
    expect(normalizeString('hello    world   again')).toBe('hello world again');
  });

  it('trims whitespace', () => {
    expect(normalizeString('   surrounded by space   ')).toBe(
      'surrounded by space',
    );
  });

  it('supports unicode characters', () => {
    expect(normalizeString('Árvíztűrő   TÜKÖRFÚRÓGÉP')).toBe(
      'árvíztűrő tükörfúrógép',
    );
    expect(normalizeString('你好   世界')).toBe('你好 世界');
  });
});
