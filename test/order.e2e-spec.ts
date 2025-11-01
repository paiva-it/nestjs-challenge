import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  RecordFormat,
  RecordCategory,
} from '../src/api/records/domain/entities/record.enum';
import { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModule } from '@nestjs/mongoose';

describe('OrderController (e2e)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let recordModel: any;
  let orderModel: any;
  const createdRecordIds: string[] = [];
  const createdOrderIds: string[] = [];

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(uri), AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ logger: false });
    await app.init();

    orderModel = app.get('OrderMongoDocumentModel');
    recordModel = app.get('RecordMongoDocumentModel');
  });

  beforeEach(async () => {
    await orderModel.deleteMany({});
    await recordModel.deleteMany({});
  });

  afterAll(async () => {
    if (createdOrderIds.length) {
      await orderModel.deleteMany({ _id: { $in: createdOrderIds } });
    }
    if (createdRecordIds.length) {
      await recordModel.deleteMany({ _id: { $in: createdRecordIds } });
    }

    await app.close();
    await mongoServer.stop();
  });

  async function createRecord(overrides: Partial<any> = {}) {
    const base = {
      artist: 'Order Artist',
      album: 'Order Album',
      price: 15,
      qty: 8,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    };
    const payload = { ...base, ...overrides };

    const res = await request(app.getHttpServer())
      .post('/records')
      .send(payload)
      .expect(201);

    createdRecordIds.push(res.body.id);
    return res.body;
  }

  it('creates an order and decreases record qty', async () => {
    const rec = await createRecord({ qty: 10 });
    const before = rec.qty;

    const orderRes = await request(app.getHttpServer())
      .post('/orders')
      .send({ recordId: rec.id, qty: 3 })
      .expect(201);

    createdOrderIds.push(orderRes.body._id);
    expect(orderRes.body.recordId).toBe(rec.id);

    const fetched = await recordModel.findById(rec.id);
    expect(fetched.qty).toBe(before - 3);
  });

  it('returns 404 when ordering non-existent record', async () => {
    const fakeId = new Types.ObjectId().toHexString();
    await request(app.getHttpServer())
      .post('/orders')
      .send({ recordId: fakeId, qty: 2 })
      .expect(404);
  });

  it('rejects invalid quantity (qty < 1)', async () => {
    const rec = await createRecord();
    await request(app.getHttpServer())
      .post('/orders')
      .send({ recordId: rec.id, qty: 0 })
      .expect(400);
  });
});
