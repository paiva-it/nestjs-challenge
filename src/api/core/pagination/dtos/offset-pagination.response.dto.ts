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
