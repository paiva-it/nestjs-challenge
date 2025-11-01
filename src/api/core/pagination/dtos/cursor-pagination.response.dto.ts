import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';

@ApiExtraModels()
export class CursorPaginationResponseDto<T> {
  @ApiProperty({ description: 'Maximum number of items returned', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Data items for this slice', isArray: true })
  data: T[];

  @ApiProperty({
    description: 'ID of the first item in this page',
    example: '60d21b4667d0d8992e610c85',
    nullable: true,
  })
  startCursor: string | null = null;

  @ApiProperty({
    description: 'ID of the last item in this page',
    example: '60d21b4667d0d8992e610c99',
    nullable: true,
  })
  endCursor: string | null = null;

  @ApiProperty({
    description: 'Cursor to fetch the next page',
    example: '60d21b4667d0d8992e610d11',
    nullable: true,
  })
  nextCursor: string | null = null;

  @ApiProperty({
    description: 'Cursor to fetch the previous page',
    example: '60d21b4667d0d8992e610c85',
    nullable: true,
  })
  previousCursor: string | null = null;

  @ApiProperty({ description: 'Whether a next page exists', example: true })
  hasNextPage: boolean = false;

  @ApiProperty({
    description: 'Whether a previous page exists',
    example: false,
  })
  hasPreviousPage: boolean = false;

  constructor(partial: Partial<CursorPaginationResponseDto<T>>) {
    Object.assign(this, partial);
  }
}
