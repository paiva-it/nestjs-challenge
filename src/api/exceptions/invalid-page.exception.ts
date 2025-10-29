import { BadRequestException } from '@nestjs/common';

export class InvalidPageException extends BadRequestException {
  constructor(page: number) {
    super(`Invalid page number: ${page}. Page must be >= 1`);
  }
}
