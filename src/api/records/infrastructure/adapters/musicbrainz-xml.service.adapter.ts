import { stringifyUnknownError } from '@api/core/log/stringify-unkown-error.util';
import { MusicBrainzReleaseResponseDto } from '@api/records/infrastructure/adapters/dtos/musicbrainz-release.response.dto';
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

@Injectable()
export class MusicBrainzXMLServiceAdapter
  implements RecordTracklistServicePort
{
  private readonly logger = new Logger(MusicBrainzXMLServiceAdapter.name);
  private readonly parser = new XMLParser();

  constructor(
    @Inject(externalConfig.KEY)
    private readonly external: ConfigType<typeof externalConfig>,
  ) {}

  shouldRefetch(
    current: Partial<RecordEntity>,
    update: Partial<RecordEntityCore>,
  ): boolean {
    return current.mbid !== update.mbid;
  }

  async fetchTracklist(record: Partial<RecordEntity>): Promise<string[]> {
    if (!record?.mbid || typeof record.mbid !== 'string') {
      return [];
    }

    const url = `https://musicbrainz.org/ws/2/release/${record.mbid}?inc=recordings&fmt=xml`;
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
        throw new NotFoundException(`MBID '${record.mbid}' not found`);
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
        this.logger.warn(`MusicBrainz timeout for MBID ${record.mbid}`);
        return [];
      }

      this.logger.warn(
        `[MusicBrainzService.fetchTracklist] Failed to fetch tracklist for MBID ${record.mbid}: ${stringifyUnknownError(error)}`,
      );

      return [];
    } finally {
      clearTimeout(timeout);
    }
  }
}
