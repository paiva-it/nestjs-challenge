import 'reflect-metadata';
import { MusicBrainzReleaseResponseDto } from './musicbrainz-release.response.validator.dto';

describe('MusicBrainzReleaseResponseDto', () => {
  let consoleSpy: jest.SpyInstance;
  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  const baseJson = {
    metadata: {
      release: {
        id: 'bdb24cb5-404b-4f60-bba4-7b730325ae47',
        'medium-list': {
          medium: {
            'track-list': {
              track: {
                position: 1,
                recording: { title: 'Song A' },
              },
            },
          },
        },
      },
    },
  };

  it('normalizes medium to array', () => {
    const result = MusicBrainzReleaseResponseDto.normalizeReleaseJson(baseJson);
    expect(Array.isArray(result.metadata.release['medium-list'].medium)).toBe(
      true,
    );
  });

  it('normalizes track to array', () => {
    const result = MusicBrainzReleaseResponseDto.normalizeReleaseJson(baseJson);
    expect(
      Array.isArray(
        result.metadata.release['medium-list'].medium[0]['track-list'].track,
      ),
    ).toBe(true);
  });

  it('creates valid DTO instance', async () => {
    const dto = await MusicBrainzReleaseResponseDto.fromJSON(baseJson);
    expect(dto).toBeInstanceOf(MusicBrainzReleaseResponseDto);
  });

  it('throws on invalid UUID', async () => {
    const invalidJson = JSON.parse(JSON.stringify(baseJson));
    invalidJson.metadata.release.id = 'not-a-uuid';

    await expect(
      MusicBrainzReleaseResponseDto.fromJSON(invalidJson),
    ).rejects.toThrow();
  });

  it('extracts formatted track list', async () => {
    const dto = await MusicBrainzReleaseResponseDto.fromJSON(baseJson);
    const result = await dto.getTrackList();
    expect(result).toEqual(['1. Song A']);
  });

  it('returns empty list when missing track list', async () => {
    const missingTrackJson = {
      metadata: {
        release: {
          id: baseJson.metadata.release.id,
          'medium-list': {
            medium: [{}],
          },
        },
      },
    };

    const dto = await MusicBrainzReleaseResponseDto.fromJSON(missingTrackJson);
    const tracks = await dto.getTrackList();
    expect(tracks).toEqual([]);
  });
});
