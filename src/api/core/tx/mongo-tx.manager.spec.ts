import { MongoTxManager } from './mongo-tx.manager';
import { CLS_KEYS } from './tx.constants';
import { ClsService } from 'nestjs-cls';
import { silenceLogger } from '@test/__mocks__/framework/logger.mock';

interface MockSession {
  withTransaction: <T>(fn: () => Promise<T>) => Promise<T>;
  endSession: () => void;
}

describe('MongoTxManager', () => {
  let connection: { startSession: jest.Mock };
  let cls: jest.Mocked<ClsService>;
  let manager: MongoTxManager;
  let session: MockSession;

  beforeEach(() => {
    silenceLogger();
    session = {
      withTransaction: jest.fn(async (fn) => fn()),
      endSession: jest.fn(),
    };

    connection = {
      startSession: jest.fn(async () => session as any),
    };

    cls = {
      set: jest.fn(),
      get: jest.fn(),
    } as any;

    manager = new MongoTxManager(connection as any, cls);
  });

  it('should set and clear CLS context around transaction', async () => {
    const result = await manager.runInTransaction(async () => 123);
    expect(result).toBe(123);
    expect(connection.startSession).toHaveBeenCalledTimes(1);
    expect(session.withTransaction).toHaveBeenCalledTimes(1);
    expect(cls.set).toHaveBeenCalledWith(CLS_KEYS.mongoSession, session);
    expect(cls.set).toHaveBeenCalledWith(CLS_KEYS.mongoSession, null);
    expect(session.endSession).toHaveBeenCalledTimes(1);
  });

  it('should propagate return value from callback', async () => {
    const value = { ok: true };
    const returned = await manager.runInTransaction(async () => value);
    expect(returned).toEqual(value);
  });

  it('should log and rethrow errors', async () => {
    const spyError = jest.spyOn((manager as any).logger, 'error');
    const boom = new Error('boom');
    await expect(
      manager.runInTransaction(async () => {
        throw boom;
      }),
    ).rejects.toThrow(boom);
    expect(spyError).toHaveBeenCalled();
    expect(cls.set).toHaveBeenCalledWith(CLS_KEYS.mongoSession, null);
  });

  it('getContext should return stored session or null', () => {
    cls.get.mockReturnValueOnce(session as any);
    expect(manager.getContext()).toBe(session);
    cls.get.mockReturnValueOnce(undefined as any);
    expect(manager.getContext()).toBeNull();
  });
});
