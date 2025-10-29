import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { RecordFormat, RecordCategory } from './record.enum';

@Schema({
  timestamps: {
    createdAt: 'created',
    updatedAt: 'lastModified',
  },
})
export class Record extends Document {
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
}

export const RecordSchema = SchemaFactory.createForClass(Record);

RecordSchema.index({
  artist: 'text',
  album: 'text',
  category: 'text',
  format: 'text',
});
RecordSchema.index({ artist: 1, album: 1, format: 1 }, { unique: true });
RecordSchema.index({ format: 1 });
RecordSchema.index({ category: 1 });
RecordSchema.index({ price: 1 });
