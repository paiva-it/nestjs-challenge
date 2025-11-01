export const musicbrainzDtoModule = {
  MusicBrainzReleaseResponseDto: class {
    static fromJSON = jest.fn();
    getTrackList = jest.fn();
  },
};
