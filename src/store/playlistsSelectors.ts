import type { Playlist, PlaylistMeta, Track } from '../types'

/**
 * Derived data helpers.
 *
 * They return new arrays, so they must be called inside `useMemo` (or receive memoized
 * inputs) rather than being used directly as a zustand selector.
 */

/** Playlists enabled for the mix, with their tracks attached. */
export function activePlaylists(
  playlists: PlaylistMeta[],
  tracks: Record<string, Track[]>,
): Playlist[] {
  return playlists
    .filter((meta) => meta.active)
    .map((meta) => ({ ...meta, tracks: tracks[meta.id] ?? [] }))
}

/** Number of tracks currently available for the mix. */
export function activeTrackCount(
  playlists: PlaylistMeta[],
  tracks: Record<string, Track[]>,
): number {
  return playlists
    .filter((meta) => meta.active)
    .reduce((total, meta) => total + (tracks[meta.id]?.length ?? 0), 0)
}

/** True when every enabled playlist has its tracks loaded. */
export function isMixReady(playlists: PlaylistMeta[], tracks: Record<string, Track[]>): boolean {
  const active = activePlaylists(playlists, tracks)
  return active.length > 0 && active.every((playlist) => playlist.tracks.length > 0)
}
