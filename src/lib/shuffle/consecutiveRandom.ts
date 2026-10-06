import type { Playlist, ShuffleOptions, Track } from '../../types'
import { shuffle } from './fisherYates'
import { activePools, buildPools, DEFAULT_SHUFFLE_OPTIONS } from './pools'

/**
 * The main mode: pick a random starting playlist, then alternate between them taking
 * one random unused track per turn. Exhausted playlists are skipped, and no track is
 * ever repeated when `dedupe` is on.
 *
 * `A=[s1,s2,s3]`, `B=[s1b,s2b,s3b]` -> `s1, s3b, s2, s1b, s3, s2b`
 */
export function consecutiveRandom(
  playlists: Playlist[],
  options: ShuffleOptions = DEFAULT_SHUFFLE_OPTIONS,
): Track[] {
  const pools = activePools(buildPools(playlists, options))
  if (pools.length === 0) return []

  let order = shuffle(pools)
  // Tracks left to emit in the current round; reaching zero starts a new round.
  let roundLeft = order.length
  let turn = 0

  const result: Track[] = []

  while (order.some((pool) => pool.length > 0)) {
    const pool = order[turn % order.length]
    turn++

    if (pool.length === 0) continue

    result.push(pool.shift() as Track)
    roundLeft--

    if (roundLeft === 0) {
      // A new round begins: optionally reshuffle the turn order for more variety.
      if (options.reshuffleRounds) {
        order = shuffle(order)
        turn = 0
      }
      roundLeft = order.filter((item) => item.length > 0).length
    }
  }

  return result
}
