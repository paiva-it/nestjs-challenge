import { OffsetPaginationResponseDto } from '../dtos/offset-pagination.response.dto';

export function buildOffsetPaginationResponse<T extends { id?: string }>(
  data: T[],
  _totalItems: number,
  _page: number,
  _limit: number,
): OffsetPaginationResponseDto<T> {
  const totalItems = Math.max(0, _totalItems);
  const limit = Math.max(1, _limit);

  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const page = Math.min(Math.max(1, _page), totalPages);

  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;
  const startIndex = (page - 1) * limit;
  const endIndex = Math.min(startIndex + data.length - 1, totalItems - 1);

  const resultsOnPage = data.length;

  return new OffsetPaginationResponseDto<T>({
    data,
    totalItems,
    page,
    pageSize: limit,
    limit,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    startIndex,
    endIndex,
    resultsOnPage,
    isFirstPage: page === 1,
    isLastPage: page === totalPages,
    nextPage: hasNextPage ? page + 1 : null,
    previousPage: hasPreviousPage ? page - 1 : null,
  });
}
