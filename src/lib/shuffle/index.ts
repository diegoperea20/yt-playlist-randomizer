import type { Playlist, ShuffleOptions, ShuffleMode, Track } from '../../types'
import { consecutiveRandom } from './consecutiveRandom'
import { fullShuffle } from './fullShuffle'
import { proportional } from './proportional'
import { sequentialBlocks } from './sequentialBlocks'

export type ShuffleEngine = (playlists: Playlist[], options: ShuffleOptions) => Track[]

/** Registry of every available randomization mode. */
export const SHUFFLE_ENGINES: Record<ShuffleMode, ShuffleEngine> = {
  'consecutive-random': consecutiveRandom,
  'full-shuffle': fullShuffle,
  proportional,
  'sequential-blocks': sequentialBlocks,
  // With no randomness the tracks keep their playlist order, but the availability and
  // dedupe filters still apply.
  none: sequentialBlocks,
}

/** Build the queue for the given mode. */
export function generateQueue(
  mode: ShuffleMode,
  playlists: Playlist[],
  options: ShuffleOptions,
): Track[] {
  const engine = SHUFFLE_ENGINES[mode] ?? consecutiveRandom
  return engine(playlists, options)
}

export { activePools, buildPools, DEFAULT_SHUFFLE_OPTIONS } from './pools'
export { consecutiveRandom } from './consecutiveRandom'
export { fullShuffle } from './fullShuffle'
export { proportional } from './proportional'
export { sequentialBlocks } from './sequentialBlocks'
export { randomPick, shuffle } from './fisherYates'
