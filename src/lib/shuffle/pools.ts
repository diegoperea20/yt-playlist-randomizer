import type { Playlist, ShuffleOptions, Track } from '../../types'
import { shuffle } from './fisherYates'

export const DEFAULT_SHUFFLE_OPTIONS: ShuffleOptions = {
  dedupe: true,
  reshuffleRounds: false,
}

/**
 * Build one shuffled pool per playlist.
 * Unavailable tracks are always dropped; cross-playlist duplicates are removed
 * up-front when `dedupe` is enabled, which keeps every algorithm simple.
 */
export function buildPools(playlists: Playlist[], options: ShuffleOptions): Track[][] {
  const seen = new Set<string>()

  return playlists.map((playlist) => {
    const playable = playlist.tracks.filter((track) => track.available)

    if (!options.dedupe) return shuffle(playable)

    const unique = playable.filter((track) => {
      if (seen.has(track.id)) return false
      seen.add(track.id)
      return true
    })

    return shuffle(unique)
  })
}

/** Pools that have at least one track left. */
export function activePools(pools: Track[][]): Track[][] {
  return pools.filter((pool) => pool.length > 0)
}
