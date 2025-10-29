import { normalizeString } from './normalize-string.util';

export function generateNgrams(str: string): string[] {
  const normalized = normalizeString(str);
  const parts = normalized.split(' ');
  const ngrams: string[] = [];

  for (const part of parts) {
    for (let i = 1; i <= part.length; i++) {
      ngrams.push(part.substring(0, i));
    }
  }

  return [...new Set(ngrams)];
}
