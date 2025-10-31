import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels()
export class OffsetPaginationResponseDto<T> {
  @ApiProperty({ description: 'Current page number (1-based)', example: 1 })
  page: number;

  @ApiProperty({ description: 'Maximum number of items per page', example: 20 })
  limit: number;

  @ApiProperty({
    description: 'Alias of limit for UI compatibility',
    example: 20,
  })
  pageSize: number;

  @ApiProperty({
    description: 'Total number of items matching the query',
    example: 250,
  })
  totalItems: number;

  @ApiProperty({ description: 'Total number of pages available', example: 13 })
  totalPages: number;

  @ApiProperty({ description: 'True if there is a next page', example: true })
  hasNextPage: boolean;

  @ApiProperty({
    description: 'True if there is a previous page',
    example: false,
  })
  hasPreviousPage: boolean;

  @ApiProperty({
    description: 'Zero-based index of first item in this page',
    example: 0,
  })
  startIndex: number;

  @ApiProperty({
    description: 'Zero-based index of last item in this page',
    example: 19,
  })
  endIndex: number;

  @ApiProperty({
    description: 'Number of items returned on this page',
    example: 20,
  })
  resultsOnPage: number;

  @ApiProperty({
    description: 'Convenience flag for first page',
    example: true,
  })
  isFirstPage: boolean;

  @ApiProperty({
    description: 'Convenience flag for last page',
    example: false,
  })
  isLastPage: boolean;

  @ApiProperty({
    description: 'Next page number if available, otherwise null',
    example: 2,
    nullable: true,
  })
  nextPage: number | null;

  @ApiProperty({
    description: 'Previous page number if available, otherwise null',
    example: null,
    nullable: true,
  })
  previousPage: number | null;

  @ApiProperty({
    description: 'Data items for the current page',
    isArray: true,
  })
  data: T[];

  constructor(partial: Partial<OffsetPaginationResponseDto<T>>) {
    Object.assign(this, partial);
  }
}

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
