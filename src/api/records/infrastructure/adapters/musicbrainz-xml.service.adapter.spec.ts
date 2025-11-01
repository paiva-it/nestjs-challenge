import { Logger } from '@nestjs/common';
import { MusicBrainzReleaseResponseDto } from './dtos/musicbrainz-release.response.validator.dto';
import { MusicBrainzXMLServiceAdapter } from './musicbrainz-xml.service.adapter';
import { CachePort } from '@api/core/cache/cache.port';
jest.mock(
  '@api/records/infrastructure/adapters/dtos/musicbrainz-release.response.validator.dto',
  () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('@test/__mocks__/external/musicbrainz.dto.jest.mock')
      .musicbrainzDtoModule;
  },
);

describe('MusicBrainzXMLServiceAdapter', () => {
  let service: MusicBrainzXMLServiceAdapter;
  let cache: jest.Mocked<CachePort>;

  const external = {
    userAgent: 'test-agent',
    defaultTimeout: 5000,
  };

  beforeEach(() => {
    cache = {
      get: jest.fn(),
      set: jest.fn(),
    } as any;

    global.fetch = jest.fn();

    service = new MusicBrainzXMLServiceAdapter(cache, external);

    (MusicBrainzReleaseResponseDto.fromJSON as jest.Mock).mockReturnValue({
      getTrackList: jest.fn().mockResolvedValue(['Track A', 'Track B']),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  // -------------------------------
  // shouldUpdate
  // -------------------------------
  it('shouldUpdate returns true when MBID is changed', () => {
    expect(service.shouldUpdate({ mbid: 'a' }, { mbid: 'b' })).toBe(true);
  });

  it('shouldUpdate returns false when MBID matches', () => {
    expect(service.shouldUpdate({ mbid: 'a' }, { mbid: 'a' })).toBe(false);
  });

  // -------------------------------
  // getTracklist
  // -------------------------------
  it('returns [] when no mbid', async () => {
    const result = await service.getTracklist({});
    expect(result).toEqual([]);
    expect(cache.get).not.toHaveBeenCalled();
  });

  it('returns cached tracklist if present', async () => {
    cache.get.mockResolvedValue(['Cached Track']);
    const result = await service.getTracklist({ mbid: 'x' });
    expect(result).toEqual(['Cached Track']);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fetches, caches, and returns result when no cache hit', async () => {
    cache.get.mockResolvedValue(null);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => `<xml></xml>`,
    });

    const result = await service.getTracklist({ mbid: 'x' });

    expect(result).toEqual(['Track A', 'Track B']);
    expect(cache.set).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalled();
  });

  it('uses negative TTL for empty tracklists', async () => {
    cache.get.mockResolvedValue(null);

    (MusicBrainzReleaseResponseDto.fromJSON as jest.Mock).mockReturnValue({
      getTrackList: jest.fn().mockResolvedValue([]),
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => `<xml></xml>`,
    });

    await service.getTracklist({ mbid: 'x' });
    expect(cache.set).toHaveBeenCalledWith(expect.any(String), [], 6 * 60 * 60);
  });

  // -------------------------------
  // Fetch errors / edge cases
  // -------------------------------

  it('returns [] on fetch abort timeout', async () => {
    jest.useFakeTimers();

    cache.get.mockResolvedValue(null);

    (global.fetch as jest.Mock).mockImplementation(() => {
      const err: any = new Error('Aborted');
      err.name = 'AbortError';
      throw err;
    });

    const result = await service.getTracklist({ mbid: 'x' });

    expect(result).toEqual([]);
  });

  it('returns [] for HTTP 404', async () => {
    cache.get.mockResolvedValue(null);

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => '',
    });

    const result = await service.getTracklist({ mbid: 'x' });

    expect(result).toEqual([]);
  });

  it('returns [] for throttling (429 / 503)', async () => {
    cache.get.mockResolvedValue(null);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => '',
    });

    const result = await service.getTracklist({ mbid: 'x' });
    expect(result).toEqual([]);
  });

  it('returns [] on unknown fetch failure', async () => {
    cache.get.mockResolvedValue(null);

    (global.fetch as jest.Mock).mockRejectedValue(new Error('Boom'));

    const result = await service.getTracklist({ mbid: 'x' });
    expect(result).toEqual([]);
  });

  // -------------------------------
  // Cache error resiliency
  // -------------------------------
  it('continues when cache.get throws', async () => {
    cache.get.mockRejectedValue(new Error('Redis down'));

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => `<xml></xml>`,
    });

    const result = await service.getTracklist({ mbid: 'x' });
    expect(result).toEqual(['Track A', 'Track B']);
  });

  it('continues when cache.set throws', async () => {
    cache.get.mockResolvedValue(null);
    cache.set.mockRejectedValue(new Error('Redis down'));

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => `<xml></xml>`,
    });

    const result = await service.getTracklist({ mbid: 'x' });
    expect(result).toEqual(['Track A', 'Track B']);
  });
});
