import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { from, lastValueFrom, Observable } from 'rxjs';
import { TX_MANAGER, TransactionManager } from './tx.port';

@Injectable()
export class TransactionalInterceptor<T> implements NestInterceptor<T, T> {
  constructor(@Inject(TX_MANAGER) private readonly tm: TransactionManager) {}

  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<T> {
    return from(
      this.tm.runInTransaction(async () => {
        return await lastValueFrom(next.handle());
      }),
    );
  }
}
