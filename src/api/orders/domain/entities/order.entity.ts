export class OrderEntityCore {
  qty: number;
  recordId: string;
}

export class OrderEntity extends OrderEntityCore {
  id: string;
  created: Date;
  lastModified: Date;
}
