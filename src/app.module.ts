import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { validationSchema } from './configuration/env.validation';
import mongodbConfig from './configuration/mongodb.config';
import paginationConfig from './configuration/pagination.config';

import { RecordModule } from './api/records/record.module';
import serverConfig from './configuration/server.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [serverConfig, mongodbConfig, paginationConfig],
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

    RecordModule,
  ],
})
export class AppModule {}
