import { TransactionalInterceptor } from './transactional.interceptor';
import { TransactionManager } from './tx.port';
import { of } from 'rxjs';
import { silenceLogger } from '@test/__mocks__/framework/logger.mock';

describe('TransactionalInterceptor', () => {
  let tm: jest.Mocked<TransactionManager>;
  let interceptor: TransactionalInterceptor<unknown>;

  beforeEach(() => {
    silenceLogger();
    tm = {
      runInTransaction: jest.fn(<T>(fn: () => Promise<T>) => fn()),
      getContext: jest.fn(),
    } as unknown as jest.Mocked<TransactionManager>;
    interceptor = new TransactionalInterceptor(tm);
  });

  it('should call runInTransaction and return inner observable value', async () => {
    const value = { ok: true };
    const handler = { handle: () => of(value) } as any;
    const result$ = interceptor.intercept({} as any, handler);
    await expect(result$.toPromise()).resolves.toEqual(value);
    expect(tm.runInTransaction).toHaveBeenCalledTimes(1);
  });

  it('should propagate errors thrown inside handler', async () => {
    const error = new Error('boom');
    const handler = { handle: () => of(Promise.reject(error)) } as any;
    const result$ = interceptor.intercept({} as any, handler);
    await expect(result$.toPromise()).rejects.toThrow(error);
    expect(tm.runInTransaction).toHaveBeenCalledTimes(1);
  });

  it('should pass through asynchronous resolution', async () => {
    const value = 42;
    const handler = { handle: () => of(Promise.resolve(value)) } as any;
    const result$ = interceptor.intercept({} as any, handler);
    await expect(result$.toPromise()).resolves.toEqual(value);
  });
});
