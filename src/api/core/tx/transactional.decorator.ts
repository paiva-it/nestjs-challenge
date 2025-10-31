import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { TransactionalInterceptor } from './transactional.interceptor';

export const Transactional = () =>
  applyDecorators(UseInterceptors(TransactionalInterceptor));
