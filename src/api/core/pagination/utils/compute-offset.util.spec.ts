import { computeOffset } from './compute-offset.util';
import { InvalidPageException } from '../exceptions/invalid-page.exception';

describe('computeOffset', () => {
  it('page=1 → offset=0', () => {
    const { normalizedPage, offset } = computeOffset(1, 10);
    expect(normalizedPage).toBe(1);
    expect(offset).toBe(0);
  });

  it('page=3, limit=10 → offset=20', () => {
    const { normalizedPage, offset } = computeOffset(3, 10);
    expect(normalizedPage).toBe(3);
    expect(offset).toBe(20);
  });

  it('handles missing page (undefined) as page 1', () => {
    const { normalizedPage, offset } = computeOffset(undefined, 15);
    expect(normalizedPage).toBe(1);
    expect(offset).toBe(0);
  });

  it('throws on negative page', () => {
    expect(() => computeOffset(-5, 25)).toThrow(InvalidPageException);
  });

  it('throws on zero page', () => {
    expect(() => computeOffset(0, 25)).toThrow(InvalidPageException);
  });

  it('throws on NaN page (non-numeric string)', () => {
    expect(() => computeOffset('abc', 7)).toThrow(InvalidPageException);
  });
});
