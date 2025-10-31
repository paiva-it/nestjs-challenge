import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ClientSession } from 'mongoose';
import { Injectable, Logger } from '@nestjs/common';
import { TransactionManager } from './tx.port';
import { ClsService } from 'nestjs-cls';
import { CLS_KEYS } from './tx.constants';

@Injectable()
export class MongoTxManager implements TransactionManager<ClientSession> {
  private readonly logger = new Logger(MongoTxManager.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly cls: ClsService,
  ) {}

  async runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
    const session = await this.connection.startSession();

    return session
      .withTransaction(async () => {
        this.cls.set(CLS_KEYS.mongoSession, session);

        try {
          return await fn();
        } catch (err) {
          this.logger.error(`Transaction aborted: ${err}`);
          throw err;
        } finally {
          this.cls.set(CLS_KEYS.mongoSession, null);
        }
      })
      .finally(() => {
        session.endSession();
      });
  }

  getContext(): ClientSession | null {
    return this.cls.get<ClientSession>(CLS_KEYS.mongoSession) ?? null;
  }
}
