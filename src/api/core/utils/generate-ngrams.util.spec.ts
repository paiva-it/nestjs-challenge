import { generateNgrams } from './generate-ngrams.util';

describe('generateNgrams', () => {
  it('generates tokens per character', () => {
    const result = generateNgrams('abc');
    expect(result).toEqual(['a', 'ab', 'abc']);
  });

  it('ignores spaces (does not include space characters as tokens)', () => {
    const result = generateNgrams('a b');
    expect(result).toEqual(['a', 'b']);
  });

  it('returns unique tokens', () => {
    const result = generateNgrams('aa a');
    expect(result).toEqual(['a', 'aa']);
  });

  it('returns empty array for empty string', () => {
    expect(generateNgrams('')).toEqual([]);
  });

  it('stable output for multiple case input', () => {
    const result = generateNgrams('  Mixed   CASE  ');
    expect(result).toEqual([
      'm',
      'mi',
      'mix',
      'mixe',
      'mixed',
      'c',
      'ca',
      'cas',
      'case',
    ]);
  });

  it('handles unicode characters', () => {
    const result = generateNgrams('árvíz');
    expect(result).toEqual(['á', 'ár', 'árv', 'árví', 'árvíz']);
  });

  it('handles multiple consecutive spaces explicitly', () => {
    const result = generateNgrams('foo     bar');
    expect(result).toEqual(['f', 'fo', 'foo', 'b', 'ba', 'bar']);
  });

  it('strips punctuation implicitly via normalization', () => {
    const result = generateNgrams('AC/DC');
    expect(result).toEqual(['a', 'ac', 'ac/', 'ac/d', 'ac/dc']);
  });
});
