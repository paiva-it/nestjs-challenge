import { PaginationLimitExceededException } from 'src/api/exceptions/pagination-limit.exception';

/**
 * Ensures that the pagination limit is within the allowed bounds.
 * @param limit The requested pagination limit.
 * @param maxLimit The maximum allowed pagination limit.
 *
 * @throws PaginationLimitExceededException if the limit exceeds maxLimit.
 */
export function ensureLimitWithinBounds(limit: number, maxLimit: number) {
  if (limit > maxLimit) {
    throw new PaginationLimitExceededException(limit, maxLimit);
  }
}
