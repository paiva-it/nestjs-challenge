import {
  IsArray,
  IsNumber,
  IsString,
  IsUUID,
  validate,
  ValidateNested,
} from 'class-validator';
import { plainToInstance, Type } from 'class-transformer';

class RecordingDto {
  @IsString()
  title: string;
}

class TrackDto {
  @IsNumber()
  position: number;

  @ValidateNested()
  @Type(() => RecordingDto)
  recording: RecordingDto;
}

class TrackListDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrackDto)
  track: TrackDto[];
}

class MediumDto {
  @ValidateNested()
  @Type(() => TrackListDto)
  'track-list': TrackListDto;
}

class MediumListDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediumDto)
  medium: MediumDto[];
}

class ReleaseDto {
  @IsString()
  @IsUUID()
  id: string;

  @ValidateNested()
  @Type(() => MediumListDto)
  'medium-list': MediumListDto;
}

class MetadataDto {
  @ValidateNested()
  @Type(() => ReleaseDto)
  release: ReleaseDto;
}

export class MusicBrainzReleaseResponseDto {
  @ValidateNested()
  @Type(() => MetadataDto)
  metadata: MetadataDto;

  async getTrackList(): Promise<string[]> {
    const mediums = this.metadata.release['medium-list'].medium;
    const medium = mediums.find(
      (medium) => medium['track-list'] && medium['track-list'].track,
    );
    const tracks = medium?.['track-list'].track ?? [];

    return tracks.map((track) => `${track.position}. ${track.recording.title}`);
  }

  static normalizeReleaseJson(json: any) {
    const clone = JSON.parse(JSON.stringify(json));
    const mediumList = clone?.metadata?.release?.['medium-list'];

    if (mediumList && !Array.isArray(mediumList.medium)) {
      mediumList.medium = [mediumList.medium];
    }

    for (const medium of mediumList.medium ?? []) {
      const trackList = medium['track-list'];

      if (trackList && !Array.isArray(trackList.track)) {
        trackList.track = [trackList.track];
      }
    }

    return clone;
  }

  static async fromJSON(json: any): Promise<MusicBrainzReleaseResponseDto> {
    json = MusicBrainzReleaseResponseDto.normalizeReleaseJson(json);

    const dto = plainToInstance(MusicBrainzReleaseResponseDto, json, {
      enableImplicitConversion: false,
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      console.error(errors);
      throw new Error('Validation failed');
    }

    return dto;
  }
}
