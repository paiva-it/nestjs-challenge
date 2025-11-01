import { PaginationLimitExceededException } from './pagination-limit.exception';
import { BadRequestException } from '@nestjs/common';

describe('PaginationLimitExceededException', () => {
  it('should extend BadRequestException', () => {
    const err = new PaginationLimitExceededException(100, 50);
    expect(err).toBeInstanceOf(BadRequestException);
  });

  it('should include limit values in message', () => {
    const limit = 100;
    const maxLimit = 50;
    const err = new PaginationLimitExceededException(limit, maxLimit);
    expect(err.message).toContain(
      `Requested limit=${limit} exceeds the allowed maximum limit=${maxLimit}`,
    );
  });
});
