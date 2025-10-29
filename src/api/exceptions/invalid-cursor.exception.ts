import { BadRequestException } from '@nestjs/common';

export class InvalidCursorException extends BadRequestException {
  constructor(cursor: string) {
    super(`Invalid cursor format: "${cursor}"`);
  }
}
