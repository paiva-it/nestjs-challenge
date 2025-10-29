import { IsInt, IsOptional, Min, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';

@ApiExtraModels()
export class CursorPaginationQueryDto {
  @ApiProperty({
    description: 'Cursor for pagination',
    type: String,
    example: '60d21b4667d0d8992e610c85',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  cursor?: string;

  @ApiProperty({
    description:
      'Number of records to return, limited per environment settings, defaults to 100',
    type: Number,
    example: 20,
    default: 20,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 20;
}
