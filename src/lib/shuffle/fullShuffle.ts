import type { Playlist, ShuffleOptions, Track } from '../../types'
import { shuffle } from './fisherYates'
import { buildPools, DEFAULT_SHUFFLE_OPTIONS } from './pools'

/** Every track from every playlist mixed into a single pool. */
export function fullShuffle(
  playlists: Playlist[],
  options: ShuffleOptions = DEFAULT_SHUFFLE_OPTIONS,
): Track[] {
  return shuffle(buildPools(playlists, options).flat())
}
