import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  RecordFormat,
  RecordCategory,
} from '../src/api/records/domain/entities/record.enum';
import { Types } from 'mongoose';
import { URLSearchParams } from 'url';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModule } from '@nestjs/mongoose';
import RedisMock from 'ioredis-mock';
import { CachePort } from '@api/core/cache/cache.port';

describe('RecordController (e2e)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let redisServer: any;
  let recordModel: any;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(uri), AppModule],
    })
      .overrideProvider(CachePort)
      .useValue(new RedisMock())
      .compile();

    app = moduleFixture.createNestApplication({ logger: false });
    await app.init();

    recordModel = app.get('RecordMongoDocumentModel');
    redisServer = app.get(CachePort);
  });

  beforeEach(async () => {
    await recordModel.deleteMany({});
    await redisServer.flushall();
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  async function createRecord(overrides: Partial<any> = {}) {
    const base = {
      artist: 'The Beatles',
      album: 'Abbey Road',
      price: 25,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    };

    const payload = { ...base, ...overrides };
    const res = await request(app.getHttpServer())
      .post('/records')
      .send(payload)
      .expect(201);

    return res.body;
  }

  it('/records returns cursor pagination DTO', async () => {
    await createRecord();
    const res = await request(app.getHttpServer()).get('/records').expect(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('limit');
    expect(res.body).toHaveProperty('hasNextPage');
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0]).toHaveProperty('artist');
  });

  it('Accepts complex search filters via query DTO', async () => {
    await createRecord({
      artist: 'Pink Floyd',
      album: 'The Wall',
      category: RecordCategory.ROCK,
    });
    await createRecord({
      artist: 'Pink Floyd',
      album: 'Wish You Were Here',
      category: RecordCategory.ROCK,
    });

    const searchParams = new URLSearchParams();
    searchParams.append('artist', 'Pink Floyd');
    searchParams.append('price_gte', '0');
    searchParams.append('price_lte', '30');
    searchParams.append('qty_gte', '5');
    searchParams.append('qty_lte', '20');

    const res = await request(app.getHttpServer())
      .get(`/records?${searchParams.toString()}`)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    for (const r of res.body.data) {
      expect(r.artist).toBe('Pink Floyd');
      expect(r.price).toBeGreaterThanOrEqual(10);
      expect(r.price).toBeLessThanOrEqual(30);
    }
  });

  it('Omits limit when not provided (uses default) and returns <= default limit', async () => {
    for (let i = 0; i < 21; i++) {
      await createRecord({ artist: `DefaultLimit Artist ${i}` });
    }

    const res = await request(app.getHttpServer()).get('/records').expect(200);
    expect(res.body.limit).toBeGreaterThanOrEqual(res.body.data.length);
  });

  it('/records/offset is guard protected and requires Authorization header', async () => {
    await request(app.getHttpServer()).get('/records/offset').expect(401);

    const res = await request(app.getHttpServer())
      .get('/records/offset')
      .set('Authorization', 'Bearer mock-token')
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('totalItems');
  });

  it('/records/offset returns offset pagination DTO with metadata', async () => {
    for (let i = 0; i < 3; i++) {
      await createRecord({ artist: `Offset Meta ${i}` });
    }

    const res = await request(app.getHttpServer())
      .get('/records/offset?limit=2&page=1')
      .set('Authorization', 'Bearer mock-token')
      .expect(200);

    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(2);
    expect(res.body.pageSize).toBe(2);
    expect(res.body.totalItems).toBeGreaterThanOrEqual(3);
    expect(res.body.totalPages).toBeGreaterThanOrEqual(2);
    expect(res.body.hasNextPage).toBe(true);
    expect(res.body.hasPreviousPage).toBe(false);
    expect(res.body.nextPage).toBe(2);
    expect(res.body.previousPage).toBeNull();
    expect(res.body.startIndex).toBe(0);
    expect(res.body.endIndex).toBeGreaterThanOrEqual(res.body.startIndex);
    expect(res.body.resultsOnPage).toBe(res.body.data.length);
  });

  it('Uses injected Record Model (verify ID format)', async () => {
    const created = await createRecord({ artist: 'Model Injection Test' });
    expect(Types.ObjectId.isValid(created.id)).toBe(true);
  });

  it('Partial token search (q) returns matching records', async () => {
    await createRecord({ artist: 'Led Zeppelin', album: 'IV' });
    await createRecord({ artist: 'Led Zeppelin', album: 'Physical Graffiti' });

    const searchParams = new URLSearchParams();
    searchParams.append('q', 'led iv');

    const res = await request(app.getHttpServer())
      .get(`/records?${searchParams.toString()}`)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(
      res.body.data.findIndex(
        (e) => e.album === 'IV' && e.artist === 'Led Zeppelin',
      ),
    ).not.toBe(-1);
  });

  it('Limit enforcement returns error when limit exceeds max', async () => {
    const res = await request(app.getHttpServer())
      .get('/records?limit=9999')
      .expect(400);

    expect(res.body.message).toMatch(/exceeds the allowed maximum/);
  });

  it('Invalid cursor returns error', async () => {
    const searchParams = new URLSearchParams();
    searchParams.append('cursor', 'not-a-valid-objectid');

    const res = await request(app.getHttpServer())
      .get(`/records?${searchParams.toString()}`)
      .expect(400);

    expect(res.body.message).toMatch(/Invalid cursor format/);
  });

  it('Negative page returns error for offset pagination', async () => {
    const searchParams = new URLSearchParams();
    searchParams.append('page', '-1');
    searchParams.append('limit', '2');

    const res = await request(app.getHttpServer())
      .get(`/records/offset?${searchParams.toString()}`)
      .set('Authorization', 'Bearer mock-token')
      .expect(400);

    expect(res.body.message).toMatch(/Invalid page number/);
  });

  it('Guard rejection without proper Authorization header', async () => {
    const res = await request(app.getHttpServer())
      .get('/records/offset')
      .expect(401);

    expect(res.body.message).toMatch(/Missing or invalid auth token/);
  });

  describe('Create & Update pipelines', () => {
    it('creates a record and returns 201', async () => {
      const created = await createRecord({ artist: 'Update Flow Artist' });
      expect(created.artist).toBe('Update Flow Artist');
      expect(created).toHaveProperty('id');
    });

    it('updates an existing record successfully', async () => {
      const created = await createRecord({
        artist: 'Artist To Update',
        qty: 1,
      });

      const res = await request(app.getHttpServer())
        .put(`/records/${created.id}`)
        .send({ qty: 5 })
        .expect(200);

      expect(res.body.qty).toBe(5);
      expect(res.body.id).toBe(created.id);
    });

    it('returns 404 when updating non-existent record', async () => {
      const fakeId = new Types.ObjectId().toHexString();

      const res = await request(app.getHttpServer())
        .put(`/records/${fakeId}`)
        .send({ qty: 99 })
        .expect(404);

      expect(res.body.message).toMatch(/Record not found/);
    });

    it('returns conflict when creating duplicate (same artist/album/format)', async () => {
      const payload = {
        artist: 'Duplicate Artist',
        album: 'Duplicate Album',
        price: 10,
        qty: 1,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
      };

      await request(app.getHttpServer())
        .post('/records')
        .send(payload)
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/records')
        .send(payload)
        .expect(409);

      expect(res.body.message).toMatch(/Record already exists/);
    });
  });
});
