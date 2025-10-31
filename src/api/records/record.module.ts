import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecordController } from './interface/record.controller';
import {
  RecordMongoDocument,
  RecordMongoSchema,
} from './infrastructure/repository/mongodb/schemas/record.mongo.schema';
import { RecordService } from './application/services/record.service';
import { RecordTokenServicePort } from './domain/ports/record-token.service.port';
import { RecordTokenNgramService } from './domain/services/record-token-ngram.service';
import { RecordRepositoryPort } from './domain/ports/record.repository.port';
import { RecordMongoRepository } from './infrastructure/repository/mongodb/record.mongo.repository';
import { MongoTxModule } from '@api/core/tx/mongo-tx.module';
import { RecordServicePort } from './domain/ports/record.service.port';
import { RecordTracklistServicePort } from './domain/ports/record-tracklist.service.port';
import { MusicBrainzXMLServiceAdapter } from './infrastructure/adapters/musicbrainz-xml.service.adapter';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RecordMongoDocument.name, schema: RecordMongoSchema },
    ]),
    MongoTxModule,
  ],
  controllers: [RecordController],
  providers: [
    {
      provide: RecordTracklistServicePort,
      useClass: MusicBrainzXMLServiceAdapter,
    },
    {
      provide: RecordServicePort,
      useClass: RecordService,
    },
    {
      provide: RecordTokenServicePort,
      useClass: RecordTokenNgramService,
    },
    {
      provide: RecordRepositoryPort,
      useClass: RecordMongoRepository,
    },
  ],
  exports: [RecordServicePort],
})
export class RecordModule {}
