import { RecordCategory, RecordFormat } from './record.enum';

export class RecordEntityCore {
  artist: string;
  album: string;
  price: number;
  qty: number;
  format: RecordFormat;
  category: RecordCategory;
  mbid?: string;
  tracklist: string[];
}

export class RecordEntity extends RecordEntityCore {
  id: string;
  created: Date;
  lastModified: Date;
}
