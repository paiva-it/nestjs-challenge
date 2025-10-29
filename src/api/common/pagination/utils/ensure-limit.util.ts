import { PaginationLimitExceededException } from '../exceptions/pagination-limit.exception';

/**
 * Ensures that the pagination limit is within the allowed bounds.
 * @param limit The requested pagination limit.
 * @param maxLimit The maximum allowed pagination limit.
 *
 * @throws PaginationLimitExceededException if the limit is less than 1 or exceeds maxLimit.
 */
export function ensureLimitWithinBounds(limit: number, maxLimit: number) {
  if (limit < 1 || limit > maxLimit) {
    throw new PaginationLimitExceededException(limit, maxLimit);
  }
}
