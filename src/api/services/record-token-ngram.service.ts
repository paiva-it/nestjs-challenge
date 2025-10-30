import { Injectable } from '@nestjs/common';
import { generateNgrams } from '../common/utils/generate-ngrams.util';
import { Record } from '../schemas/record.schema';

@Injectable()
export class RecordTokenNgramService {
  private static readonly TOKEN_FIELDS: (keyof Record)[] = [
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

  generate(doc: Partial<Record>): string[] {
    const tokens: string[] = [];

    for (const field of RecordTokenNgramService.TOKEN_FIELDS) {
      const value = doc[field];

      if (value) {
        tokens.push(...generateNgrams(value));
      }
    }

    return [...new Set(tokens)];
  }
}
