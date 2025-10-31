import { ensureLimitWithinBounds } from './ensure-limit.util';
import { PaginationLimitExceededException } from '../exceptions/pagination-limit.exception';

describe('ensureLimitWithinBounds', () => {
  const maxLimit = 50;

  it('allows when below maxLimit', () => {
    expect(() => ensureLimitWithinBounds(10, maxLimit)).not.toThrow();
  });

  it('allows when equal to maxLimit', () => {
    expect(() => ensureLimitWithinBounds(maxLimit, maxLimit)).not.toThrow();
  });

  it('throws when above maxLimit', () => {
    expect(() => ensureLimitWithinBounds(maxLimit + 1, maxLimit)).toThrow(
      PaginationLimitExceededException,
    );
  });

  it('throws on zero (invalid lower bound)', () => {
    expect(() => ensureLimitWithinBounds(0, maxLimit)).toThrow(
      PaginationLimitExceededException,
    );
  });

  it('throws on negative limit', () => {
    expect(() => ensureLimitWithinBounds(-5, maxLimit)).toThrow(
      PaginationLimitExceededException,
    );
  });
});
