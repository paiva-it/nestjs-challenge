export const RecordTokenServicePort = Symbol('RecordTokenServicePort');

export interface RecordTokenServicePort {
  needsRecompute(modifiedPaths: string[]): boolean;
  generate(doc: object): string[];
}
