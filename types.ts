
export enum AudioTrack {
  Salute = 'salute',
  Anthem = 'anthem',
  Tribute = 'tribute',
  SchoolSong = 'schoolSong',
}

export const audioTrackDetails: { [key in AudioTrack]: { label: string } } = {
  [AudioTrack.Salute]: { label: '국기에 대한 경례' },
  [AudioTrack.Anthem]: { label: '애국가 제창' },
  [AudioTrack.Tribute]: { label: '순국선열 및 호국영령에 대한 묵념' },
  [AudioTrack.SchoolSong]: { label: '교가 제창' },
};
