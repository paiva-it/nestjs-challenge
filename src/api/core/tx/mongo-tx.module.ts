import { Module } from '@nestjs/common';
import { MongoTxManager } from './mongo-tx.manager';
import { TX_MANAGER } from './tx.port';

@Module({
  providers: [
    MongoTxManager,
    {
      provide: TX_MANAGER,
      useExisting: MongoTxManager,
    },
  ],
  exports: [
    {
      provide: TX_MANAGER,
      useExisting: MongoTxManager,
    },
  ],
})
export class MongoTxModule {}
