import { Document } from 'mongoose';

export class MongoMapper<
  TDocument extends Partial<Document> & { _id?: any },
  TEntity extends { id: string },
> {
  private handleObjectId(id: unknown): string {
    return typeof id === 'string' ? id : id.toString();
  }

  public toEntity(
    document: TDocument,
  ): Omit<TDocument, '_id'> & Pick<TEntity, 'id'> {
    if (!document) throw new Error('document is missing');
    if (!document._id) throw new Error('document._id is missing');

    if (typeof document.toObject !== 'function') {
      const { _id, ...rest } = document;

      return {
        ...rest,
        id: this.handleObjectId(_id),
      };
    }

    const plain = document.toObject();
    const { _id, ...rest } = plain;

    return {
      ...rest,
      id: this.handleObjectId(_id),
    };
  }
}
