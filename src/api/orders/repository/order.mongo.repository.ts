import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OrderRepositoryPort } from '../port/order.repository.port';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from '../schemas/order.schema';
import { Model } from 'mongoose';
import mongodbConfig from '../../../configuration/mongodb.config';
import { ConfigType } from '@nestjs/config';
import { Record } from '../../records/schemas/record.schema';
import { InsufficientStockException } from '../exceptions/insufficient-stock.exception';
import { stringifyUnkownVariable } from '../../common/log/utils/stringify-mongo-query.util';
import { stringifyUnknownError } from '../../common/log/utils/stringify-unkown-error.util';
import { CreateOrderRequestDto } from '../dtos/create-order.request.dto';

@Injectable()
export class OrderMongoRepository implements OrderRepositoryPort {
  private readonly logger = new Logger(OrderMongoRepository.name);

  constructor(
    @InjectModel(Order.name)
    private readonly model: Model<Order>,

    @InjectModel(Record.name)
    private readonly recordModel: Model<Record>,

    @Inject(mongodbConfig.KEY)
    private readonly mongodb: ConfigType<typeof mongodbConfig>,
  ) {}

  async create(order: CreateOrderRequestDto): Promise<Order> {
    const session = await this.model.startSession();

    try {
      session.startTransaction();

      const updated = await this.recordModel.findOneAndUpdate(
        { _id: order.recordId, qty: { $gte: order.qty } },
        { $inc: { qty: -order.qty } },
        { session, new: true },
      );

      if (!updated) {
        const record = await this.recordModel
          .findById(order.recordId)
          .session(session);

        if (!record) {
          throw new NotFoundException('Record not found');
        }

        throw new InsufficientStockException(order.qty, record.qty);
      }

      const orderResult = await new this.model(order).save({ session });

      if (!orderResult) {
        throw new InternalServerErrorException('Failed to create order');
      }

      await session.commitTransaction();

      return orderResult;
    } catch (error) {
      await session.abortTransaction();

      this.logger.error(
        `[Order.create] Failed to create order with payload ${stringifyUnkownVariable(order)}: ${stringifyUnknownError(error)}`,
      );
      throw error;
    } finally {
      await session.endSession();
    }
  }
}
