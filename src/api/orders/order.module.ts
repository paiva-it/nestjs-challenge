import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  OrderMongoDocument,
  OrderMongoSchema,
} from './infrastructure/repository/mongodb/schemas/order.mongo.schema';
import { MongoTxModule } from '@api/core/tx/mongo-tx.module';
import { OrderController } from './interface/order.controller';
import { OrderService } from './application/services/order.service';
import { OrderRepositoryPort } from './domain/ports/order.repository.port';
import { OrderMongoRepository } from './infrastructure/repository/mongodb/order.mongo.repository';
import { RecordModule } from '@api/records/record.module';
import { OrderServicePort } from './domain/ports/order.service.port';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OrderMongoDocument.name, schema: OrderMongoSchema },
    ]),
    MongoTxModule,
    RecordModule,
  ],
  controllers: [OrderController],
  providers: [
    {
      provide: OrderServicePort,
      useClass: OrderService,
    },
    {
      provide: OrderRepositoryPort,
      useClass: OrderMongoRepository,
    },
  ],
})
export class OrderModule {}
