import { generateNgrams } from '@api/core/utils/generate-ngrams.util';
import { RecordEntity } from '@api/records/domain/entities/record.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RecordTokenNgramService {
  private static readonly TOKEN_FIELDS: (keyof RecordEntity)[] = [
    'artist',
    'album',
    'category',
    'format',
  ];

  needsRecompute(modifiedPaths: string[]): boolean {
    return RecordTokenNgramService.TOKEN_FIELDS.some((field) =>
      modifiedPaths.includes(field),
    );
  }

  generate(doc: Partial<RecordEntity>): string[] {
    const tokens: string[] = [];

    for (const field of RecordTokenNgramService.TOKEN_FIELDS) {
      const value = doc[field];

      if (typeof value !== 'string') {
        throw new Error(
          `Field ${field} must be a string to generate n-gram tokens`,
        );
      }

      if (value) {
        tokens.push(...generateNgrams(value));
      }
    }

    return [...new Set(tokens)];
  }
}
