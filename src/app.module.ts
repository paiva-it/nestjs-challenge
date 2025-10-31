import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';

import { validationSchema } from './configuration/env.validation';
import mongodbConfig from './configuration/mongodb.config';
import paginationConfig from './configuration/pagination.config';

import serverConfig from './configuration/server.config';
import externalConfig from './configuration/external.config';
import { RecordModule } from '@api/records/record.module';
import { OrderModule } from '@api/orders/order.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [serverConfig, mongodbConfig, paginationConfig, externalConfig],
      validationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),

    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('mongodb.uri', { infer: true }),
      }),
      inject: [ConfigService],
    }),

    ClsModule.forRoot({
      global: true,
    }),

    RecordModule,
    OrderModule,
  ],
})
export class AppModule {}
