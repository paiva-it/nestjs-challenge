import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecordController } from './controllers/record.controller';
import { RecordService } from './services/record.service';
import { Record, RecordSchema } from './schemas/record.schema';
import { RecordMongoRepository } from './repository/record.mongo.repository';
import { RecordRepositoryPort } from './ports/record.repository.port';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Record.name, schema: RecordSchema }]),
  ],
  controllers: [RecordController],
  providers: [
    RecordService,
    {
      provide: RecordRepositoryPort,
      useClass: RecordMongoRepository,
    },
  ],
})
export class RecordModule {}
