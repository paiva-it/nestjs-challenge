import { InvalidPageException } from '../exceptions/invalid-page.exception';

/**
 * Computes the offset for pagination.
 * @param page - The current page number (1-based).
 * @param limit - The maximum number of items per page.
 *
 * @throws InvalidPageException if the page number is less than 1.
 *
 * @returns A tuple containing the normalizedPage and the computed offset.
 */
export function computeOffset(
  page: number | string | undefined,
  limit: number,
): {
  normalizedPage: number;
  offset: number;
} {
  const normalizedPage = Number(page ?? 1);

  if (isNaN(normalizedPage) || normalizedPage < 1) {
    throw new InvalidPageException(normalizedPage);
  }

  return { normalizedPage, offset: (normalizedPage - 1) * limit };
}
