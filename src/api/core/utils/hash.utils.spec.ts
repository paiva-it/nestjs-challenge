import { hash } from './hash.utils';

describe('hash', () => {
  it('hashes strings deterministically', () => {
    const result = hash('hello world');
    const helloWorldMD5Hash = '5eb63bbbe01eeed093cb22bb8f5acdc3';
    expect(result).toBe(helloWorldMD5Hash);
  });

  it('produces different hashes for different strings', () => {
    expect(hash('foo')).not.toBe(hash('bar'));
  });

  it('serializes non-string input consistently', () => {
    const obj = { a: 1, b: 2 };
    const h1 = hash(obj);
    const h2 = hash(obj);
    expect(h1).toBe(h2);
  });

  it('hashes arrays consistently', () => {
    const arr = ['a', 'b', 'c'];
    const h1 = hash(arr);
    const h2 = hash(arr);
    expect(h1).toBe(h2);
  });

  it('hashes numbers consistently', () => {
    expect(hash(123)).toBe(hash(123));
  });

  it('hashes booleans consistently', () => {
    expect(hash(true)).toBe(hash(true));
  });

  it('hashes null/undefined without crashing', () => {
    expect(() => hash(null)).not.toThrow();
    expect(() => hash(undefined)).not.toThrow();
  });

  it('produces different hashes for different objects', () => {
    expect(hash({ a: 1 })).not.toBe(hash({ a: 2 }));
  });
});
