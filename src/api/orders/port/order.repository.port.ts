import { CreateOrderRequestDto } from '../dtos/create-order.request.dto';
import { Order } from '../schemas/Order.schema';

export const OrderRepositoryPort = Symbol('OrderRepositoryPort');

export interface OrderRepositoryPort {
  create: (Order: CreateOrderRequestDto) => Promise<Order>;
}
