import { RecordEntity } from '@api/records/domain/entities/record.entity';
import { RecordMongoDocument } from '../schemas/record.mongo.schema';
import { MongoMapper } from '../../../../../core/repository/mongo.mapper';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RecordMongoMapper {
  private readonly base = new MongoMapper<RecordMongoDocument, RecordEntity>();

  public toEntity(document: RecordMongoDocument): RecordEntity {
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { searchTokens, ...rest } = this.base.toEntity(document);

    return rest;
  }
}
