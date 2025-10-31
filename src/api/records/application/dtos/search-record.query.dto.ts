import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  RecordCategory,
  RecordFormat,
} from '@api/records/domain/entities/record.enum';

export class SearchRecordQueryDto {
  @ApiProperty({
    description:
      'Fuzzy search query for all text fields (artist, album, category and format)',
    type: String,
    example: 'Beatles Abbey Road Vinyl',
    required: false,
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiProperty({
    description: 'Filter by artist name',
    type: String,
    example: 'The Beatles',
    required: false,
  })
  @IsOptional()
  @IsString()
  artist?: string;
  @ApiProperty({
    description: 'Filter by album name',
    type: String,
    example: 'Abbey Road',
    required: false,
  })
  @IsOptional()
  @IsString()
  album?: string;

  @ApiProperty({
    description: 'Filter by record format',
    enum: RecordFormat,
    example: RecordFormat.VINYL,
    required: false,
  })
  @IsOptional()
  @IsEnum(RecordFormat)
  format?: RecordFormat;
  @ApiProperty({
    description: 'Filter by record category',
    enum: RecordCategory,
    example: RecordCategory.ROCK,
    required: false,
  })
  @IsOptional()
  @IsEnum(RecordCategory)
  category?: RecordCategory;

  @ApiProperty({
    description: 'Minimum price filter',
    type: Number,
    example: 10,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price_gte?: number;
  @ApiProperty({
    description: 'Maximum price filter',
    type: Number,
    example: 50,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price_lte?: number;

  @ApiProperty({
    description: 'Minimum quantity filter',
    type: Number,
    example: 5,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  qty_gte?: number;
  @ApiProperty({
    description: 'Maximum quantity filter',
    type: Number,
    example: 20,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  qty_lte?: number;
}
