import { Document } from 'mongoose';

export class MongoMapper<
  TDocument extends Document,
  TEntity extends { id: string },
> {
  public toEntity(
    document: TDocument,
  ): Omit<TDocument, '_id'> & Pick<TEntity, 'id'> {
    if (!document) throw new Error('document is missing');
    if (!document._id) throw new Error('document._id is missing');
    if (typeof document.toObject !== 'function')
      throw new Error('document.toObject is not a function');

    const plain = document.toObject();
    const { _id, ...rest } = plain;

    return {
      ...rest,
      id: _id.toString(),
    };
  }
}
