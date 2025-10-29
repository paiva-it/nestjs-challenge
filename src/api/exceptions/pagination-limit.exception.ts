import { BadRequestException } from '@nestjs/common';

export class PaginationLimitExceededException extends BadRequestException {
  constructor(limit: number, maxLimit: number) {
    super(
      `Requested limit=${limit} exceeds the allowed maximum limit=${maxLimit}`,
    );
  }
}
