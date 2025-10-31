import { RecordEntity } from '@api/records/domain/entities/record.entity';
import {
  RecordCategory,
  RecordFormat,
} from '@api/records/domain/entities/record.enum';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: {
    createdAt: 'created',
    updatedAt: 'lastModified',
  },
})
export class RecordMongoDocument
  extends Document
  implements Omit<RecordEntity, 'id'>
{
  @Prop({ required: true })
  artist: string;

  @Prop({ required: true })
  album: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  qty: number;

  @Prop({ enum: RecordFormat, required: true })
  format: RecordFormat;

  @Prop({ enum: RecordCategory, required: true })
  category: RecordCategory;

  @Prop({ required: false })
  mbid?: string;

  @Prop({ type: [String], default: [] })
  tracklist: string[];

  /* DB Specific */
  @Prop({ type: [String], default: [] })
  searchTokens: string[];

  /* Timestamps managed by @Schema Mongoose decorator */
  created: Date;
  lastModified: Date;
}

export const RecordMongoSchema =
  SchemaFactory.createForClass(RecordMongoDocument);

RecordMongoSchema.index({ artist: 1, album: 1, format: 1 }, { unique: true });
RecordMongoSchema.index({ format: 1 });
RecordMongoSchema.index({ category: 1 });
RecordMongoSchema.index({ price: 1 });
RecordMongoSchema.index({ searchTokens: 1 });
