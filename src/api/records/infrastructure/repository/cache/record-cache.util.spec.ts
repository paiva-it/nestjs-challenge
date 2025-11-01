import { RecordCacheUtil } from './record-cache.util';
import { Logger } from '@nestjs/common';
import { createCachePortMock } from '@test/__mocks__/cache/cache-port.mock';

describe('RecordCacheUtil', () => {
  const cache = createCachePortMock();
  const util = new RecordCacheUtil(cache);
  const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

  afterEach(() => {
    jest.clearAllMocks();
  });

  const record = { id: 'r1', name: 'Name' } as any;

  it('gets record', async () => {
    cache.get.mockResolvedValue(record);
    await expect(util.getRecord('r1')).resolves.toEqual(record);
    expect(cache.get).toHaveBeenCalledWith('record:r1');
  });

  it('returns null and logs on get error', async () => {
    cache.get.mockRejectedValue(new Error('boom'));
    await expect(util.getRecord('r1')).resolves.toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('sets record', async () => {
    cache.set.mockResolvedValue();
    await util.setRecord(record);
    expect(cache.set).toHaveBeenCalledWith(
      'record:r1',
      record,
      expect.any(Number),
    );
  });

  it('logs on set error', async () => {
    cache.set.mockRejectedValue(new Error('fail'));
    await util.setRecord(record);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('deletes record', async () => {
    cache.delete.mockResolvedValue();
    await util.deleteRecord('r1');
    expect(cache.delete).toHaveBeenCalledWith('record:r1');
  });

  it('logs on delete error', async () => {
    cache.delete.mockRejectedValue(new Error('fail'));
    await util.deleteRecord('r1');
    expect(warnSpy).toHaveBeenCalled();
  });
});
