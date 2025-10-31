import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Put,
  UseGuards,
  Inject,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { RecordEntity } from '../domain/entities/record.entity';
import { CreateRecordRequestDTO } from '../application/dtos/create-record.request.dto';
import { UpdateRecordRequestDTO } from '../application/dtos/update-record.request.dto';
import { CursorPaginationResponseDto } from '@api/core/pagination/dtos/cursor-pagination.response.dto';
import { SearchRecordQueryDto } from '../application/dtos/search-record.query.dto';
import { CursorPaginationQueryDto } from '@api/core/pagination/dtos/cursor-pagination.query.dto';
import { MockAuthGuard } from '@api/core/guards/mock-auth.guard';
import { OffsetPaginationResponseDto } from '@api/core/pagination/dtos/offset-pagination.response.dto';
import { OffsetPaginationQueryDto } from '@api/core/pagination/dtos/offset-pagination.query.dto';
import { RecordServicePort } from '../domain/ports/record.service.port';

@Controller('records')
export class RecordController {
  constructor(
    @Inject(RecordServicePort)
    private readonly service: RecordServicePort,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new record' })
  @ApiCreatedResponse({
    description: 'Record successfully created',
    type: RecordEntity,
  })
  @ApiBadRequestResponse({
    description: 'Invalid record data provided',
  })
  async create(@Body() request: CreateRecordRequestDTO): Promise<RecordEntity> {
    return await this.service.create(request);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing record' })
  @ApiOkResponse({
    description: 'Record updated successfully',
    type: RecordEntity,
  })
  @ApiNotFoundResponse({
    description: 'Record not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid record data provided',
  })
  async update(
    @Param('id') id: string,
    @Body() updateRecordDto: UpdateRecordRequestDTO,
  ): Promise<RecordEntity> {
    return await this.service.update(id, updateRecordDto);
  }

  @Get()
  @ApiOperation({ summary: 'Search through records, using cursor pagination' })
  @ApiOkResponse({
    description: 'Cursor-paginated list of records',
    type: CursorPaginationResponseDto<RecordEntity>,
  })
  @ApiBadRequestResponse({
    description: 'Invalid search parameters',
  })
  async findWithCursorPagination(
    @Query() searchFilters: SearchRecordQueryDto,
    @Query() pagination: CursorPaginationQueryDto,
  ): Promise<CursorPaginationResponseDto<RecordEntity>> {
    return this.service.findWithCursorPagination(searchFilters, pagination);
  }

  @Get('/offset')
  @UseGuards(MockAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search through records, using offset pagination' })
  @ApiOkResponse({
    description: 'Offset-paginated list of records',
    type: OffsetPaginationResponseDto<RecordEntity>,
  })
  @ApiBadRequestResponse({
    description: 'Invalid search parameters',
  })
  async findWithOffsetPagination(
    @Query() searchFilters: SearchRecordQueryDto,
    @Query() pagination: OffsetPaginationQueryDto,
  ): Promise<OffsetPaginationResponseDto<RecordEntity>> {
    return this.service.findWithOffsetPagination(searchFilters, pagination);
  }
}
