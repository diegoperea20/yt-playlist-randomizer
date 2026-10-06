import type { Playlist, ShuffleOptions, Track } from '../../types'
import { buildPools, DEFAULT_SHUFFLE_OPTIONS } from './pools'

/**
 * Interleave the playlists while respecting their relative sizes: on every turn the
 * playlist that has consumed the smallest fraction of itself is served next, so a big
 * playlist cannot flood the beginning of the queue nor a small one be dropped at the end.
 */
export function proportional(
  playlists: Playlist[],
  options: ShuffleOptions = DEFAULT_SHUFFLE_OPTIONS,
): Track[] {
  const pools = buildPools(playlists, options).filter((pool) => pool.length > 0)
  if (pools.length === 0) return []

  const totals = pools.map((pool) => pool.length)
  const consumed = pools.map(() => 0)
  const result: Track[] = []
  let left = totals.reduce((sum, count) => sum + count, 0)

  while (left > 0) {
    // The playlist that is furthest behind its own share wins; ties keep playlist order,
    // which makes equally sized playlists alternate strictly.
    let bestIndex = 0
    let bestScore = Infinity

    for (let i = 0; i < pools.length; i++) {
      if (totals[i] - consumed[i] === 0) continue
      const score = consumed[i] / totals[i]
      if (score < bestScore) {
        bestScore = score
        bestIndex = i
      }
    }

    result.push(pools[bestIndex].shift() as Track)
    consumed[bestIndex]++
    left--
  }

  return result
}
