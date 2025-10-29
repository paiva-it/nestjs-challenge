/**
 * Computes the offset for pagination.
 * @param page - The current page number (1-based).
 * @param limit - The maximum number of items per page.
 *
 * @returns A tuple containing the normalizedPage and the computed offset.
 */
export function computeOffset(
  page: number | string,
  limit: number,
): {
  normalizedPage: number;
  offset: number;
} {
  const normalizedPage = Number(page) || 1;

  return { normalizedPage, offset: (normalizedPage - 1) * limit };
}
