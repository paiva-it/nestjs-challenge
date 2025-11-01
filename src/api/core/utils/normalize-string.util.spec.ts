import { normalizeString } from './normalize-string.util';

describe('normalizeString', () => {
  it('returns lowercased string', () => {
    expect(normalizeString('Hello WORLD')).toBe('hello world');
  });

  it('collapses multiple spaces into one', () => {
    expect(normalizeString('hello    world   again')).toBe('hello world again');
  });

  it('trims surrounding whitespace', () => {
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

  it('returns empty string when input is empty', () => {
    expect(normalizeString('')).toBe('');
  });

  it('returns empty string when only whitespace provided', () => {
    expect(normalizeString('     ')).toBe('');
  });

  it('collapses other whitespace characters (tabs/newlines)', () => {
    expect(normalizeString('hello\t\tworld\n\nagain')).toBe(
      'hello world again',
    );
  });

  it('handles non-breaking spaces correctly', () => {
    expect(normalizeString('hello\u00A0\u00A0world')).toBe('hello world');
  });

  it('is idempotent', () => {
    const once = normalizeString('  Hello   World  ');
    const twice = normalizeString(once);
    expect(twice).toBe(once);
  });
});
