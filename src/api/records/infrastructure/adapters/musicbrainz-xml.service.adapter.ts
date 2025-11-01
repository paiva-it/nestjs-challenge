import { stringifyUnknownError } from '@api/core/log/stringify-unknown-error.util';
import { MusicBrainzReleaseResponseDto } from '@api/records/infrastructure/adapters/dtos/musicbrainz-release.response.validator.dto';
import {
  RecordEntity,
  RecordEntityCore,
} from '@api/records/domain/entities/record.entity';
import { RecordTracklistServicePort } from '@api/records/domain/ports/record-tracklist.service.port';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { XMLParser } from 'fast-xml-parser';
import externalConfig from 'src/configuration/external.config';
import { CachePort } from '@api/core/cache/cache.port';

@Injectable()
export class MusicBrainzXMLServiceAdapter
  implements RecordTracklistServicePort
{
  private readonly logger = new Logger(MusicBrainzXMLServiceAdapter.name);
  private readonly parser = new XMLParser();
  private readonly TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
  private readonly NEGATIVE_CACHE_TTL_SECONDS = 6 * 60 * 60; // 6 hours

  constructor(
    @Inject(CachePort) private readonly cache: CachePort,
    @Inject(externalConfig.KEY)
    private readonly external: ConfigType<typeof externalConfig>,
  ) {}

  shouldUpdate(
    current: Partial<RecordEntity>,
    update: Partial<RecordEntityCore>,
  ): boolean {
    return current.mbid !== update.mbid;
  }

  async getTracklist(record: Partial<RecordEntity>): Promise<string[]> {
    if (!record?.mbid || typeof record.mbid !== 'string') {
      return [];
    }

    const cached = await this.getCache(record.mbid);
    if (cached) {
      return cached;
    }

    const tracklist = await this.fetchTracklist(record.mbid);

    this.setCache(record.mbid, tracklist);

    return tracklist;
  }

  private cacheKey(mbid: string): string {
    return `musicbrainz:tracklist:${mbid}`;
  }

  private async getCache(mbid: string): Promise<string[] | null> {
    try {
      return await this.cache.get<string[]>(this.cacheKey(mbid));
    } catch (error) {
      this.logger.warn(
        `[MusicBrainzService.getCache] Failed to get cache for MBID ${mbid}: ${stringifyUnknownError(
          error,
        )}`,
      );
      return null;
    }
  }

  private async setCache(mbid: string, tracklist: string[]): Promise<void> {
    try {
      const ttl = tracklist.length
        ? this.TTL_SECONDS
        : this.NEGATIVE_CACHE_TTL_SECONDS;

      await this.cache.set<string[]>(this.cacheKey(mbid), tracklist, ttl);
    } catch (error) {
      this.logger.warn(
        `[MusicBrainzService.setCache] Failed to set cache for MBID ${mbid}: ${stringifyUnknownError(
          error,
        )}`,
      );
    }
  }

  private async fetchTracklist(mbid: string): Promise<string[]> {
    const url = `https://musicbrainz.org/ws/2/release/${mbid}?inc=recordings&fmt=xml`;
    const headers = { 'User-Agent': this.external.userAgent };

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.external.defaultTimeout,
    );

    try {
      const response = await fetch(url, {
        headers,
        signal: controller.signal,
      });

      if (response.status === 404) {
        throw new NotFoundException(`MBID '${mbid}' not found`);
      }

      if (response.status === 503 || response.status === 429) {
        throw new ServiceUnavailableException(
          `MusicBrainz throttled request (status ${response.status}). Try again later.`,
        );
      }

      const text = await response.text();

      if (!response.ok) {
        throw new InternalServerErrorException(
          `MusicBrainz returned ${response.status}: ${text}`,
        );
      }

      const json = this.parser.parse(text);
      const release = await MusicBrainzReleaseResponseDto.fromJSON(json);

      return await release.getTrackList();
    } catch (error) {
      if (error.name === 'AbortError') {
        this.logger.warn(`MusicBrainz timeout for MBID ${mbid}`);
        return [];
      }

      this.logger.warn(
        `[MusicBrainzService.fetchTracklist] Failed to fetch tracklist for MBID ${mbid}: ${stringifyUnknownError(error)}`,
      );

      return [];
    } finally {
      clearTimeout(timeout);
    }
  }
}
