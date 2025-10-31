import { CreateOrderRequestDto } from '@api/orders/application/dtos/create-order.request.dto';
import { OrderEntity } from '../entities/order.entity';

export const OrderServicePort = Symbol('OrderServicePort');

export interface OrderServicePort {
  create: (record: CreateOrderRequestDto) => Promise<OrderEntity>;
}
