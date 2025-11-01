import { CursorPaginationResponseDto } from '../dtos/cursor-pagination.response.dto';

export function buildCursorPaginationResponse<T extends { id?: string }>(
  cursor: string | null | undefined,
  data: T[],
  limit: number,
  deriveFromIds: boolean = true,
): CursorPaginationResponseDto<T> {
  const pageItems = data.slice(0, limit);
  const first = pageItems[0];
  const last = pageItems[pageItems.length - 1];

  const response = new CursorPaginationResponseDto<T>({
    data: pageItems,
    limit,
  });

  if (data.length > limit && pageItems.length > 0 && last.id) {
    response.nextCursor = String(last.id);
    response.hasNextPage = true;
  }

  if (cursor) {
    response.previousCursor = cursor;
    response.hasPreviousPage = true;
  }

  if (deriveFromIds && pageItems.length > 0) {
    if (first.id) {
      response.startCursor = String(first.id);
    }
    if (last.id) {
      response.endCursor = String(last.id);
    }
  }

  return response;
}
