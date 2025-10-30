import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Record } from '../schemas/record.schema';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';
import { RecordService } from '../services/record.service';
import { CursorPaginationResponseDto } from '../common/pagination/dtos/cursor-pagination.response.dto';
import { SearchRecordQueryDto } from '../dtos/search-record.query.dto';
import { CursorPaginationQueryDto } from '../common/pagination/dtos/cursor-pagination.query.dto';
import { OffsetPaginationQueryDto } from '../common/pagination/dtos/offset-pagination.query.dto';
import { OffsetPaginationResponseDto } from '../common/pagination/dtos/offset-pagination.response.dto';
import { MockAuthGuard } from '../guards/mock-auth.guard';

@Controller('records')
export class RecordController {
  constructor(private readonly service: RecordService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new record' })
  @ApiResponse({ status: 201, description: 'Record successfully created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async create(@Body() request: CreateRecordRequestDTO): Promise<Record> {
    return await this.service.create(request);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing record' })
  @ApiResponse({ status: 200, description: 'Record updated successfully' })
  @ApiResponse({ status: 500, description: 'Cannot find record to update' })
  async update(
    @Param('id') id: string,
    @Body() updateRecordDto: UpdateRecordRequestDTO,
  ): Promise<Record> {
    return await this.service.update(id, updateRecordDto);
  }

  @Get()
  @ApiOperation({ summary: 'Search through records, using cursor pagination' })
  @ApiOkResponse({
    description: 'Cursor-paginated list of records',
    type: CursorPaginationResponseDto<Record>,
  })
  async findWithCursorPagination(
    @Query() searchFilters: SearchRecordQueryDto,
    @Query() pagination: CursorPaginationQueryDto,
  ) {
    return this.service.findWithCursorPagination(searchFilters, pagination);
  }

  @Get('/offset')
  @UseGuards(MockAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search through records, using offset pagination' })
  @ApiOkResponse({
    description: 'Offset-paginated list of records',
    type: OffsetPaginationResponseDto<Record>,
  })
  async findWithOffsetPagination(
    @Query() searchFilters: SearchRecordQueryDto,
    @Query() pagination: OffsetPaginationQueryDto,
  ) {
    return this.service.findWithOffsetPagination(searchFilters, pagination);
  }
}
