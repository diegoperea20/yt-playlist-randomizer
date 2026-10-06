import type { Playlist, ShuffleOptions, Track } from '../../types'
import { buildPools, DEFAULT_SHUFFLE_OPTIONS } from './pools'

/** Playlist by playlist, each one shuffled internally, in the original playlist order. */
export function sequentialBlocks(
  playlists: Playlist[],
  options: ShuffleOptions = DEFAULT_SHUFFLE_OPTIONS,
): Track[] {
  return buildPools(playlists, options).flat()
}
