import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { OrderController } from './controllers/order.controller';
import { OrderService } from './services/order.service';
import { OrderRepositoryPort } from './port/order.repository.port';
import { OrderMongoRepository } from './repository/order.mongo.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    {
      provide: OrderRepositoryPort,
      useClass: OrderMongoRepository,
    },
  ],
})
export class OrderModule {}
