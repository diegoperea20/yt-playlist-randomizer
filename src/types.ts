/** A single playable item coming from a playlist. */
export type Track = {
  /** YouTube videoId. YouTube Music tracks use the same ids as regular videos. */
  id: string
  title: string
  channel: string
  thumbnail: string
  durationSec: number
  /** Id of the playlist this track came from. */
  playlistId: string
  /** Set to false when the IFrame API rejects the embed (errors 100/101/150). */
  available: boolean
}

export type Playlist = {
  /** The `list=` value. */
  id: string
  /** User editable name, e.g. "Playlist A". */
  label: string
  url: string
  tracks: Track[]
  loadedAt: number
}

export type ShuffleMode =
  /** Alternate between playlists, taking one random unused track per turn. */
  | 'consecutive-random'
  /** Everything mixed into a single pool. */
  | 'full-shuffle'
  /** Alternate respecting the relative size of each playlist. */
  | 'proportional'
  /** Playlist by playlist, each one shuffled internally. */
  | 'sequential-blocks'
  /** Original order, concatenated. */
  | 'none'

export type RepeatMode = 'off' | 'all' | 'one'

export type ShuffleOptions = {
  /** Drop tracks whose videoId already appeared in another playlist. */
  dedupe: boolean
  /** Re-shuffle the playlist turn order on every round for more variety. */
  reshuffleRounds: boolean
}

/** Metadata persisted in localStorage; the heavy `tracks` array lives in IndexedDB. */
export type PlaylistMeta = Omit<Playlist, 'tracks'> & {
  trackCount: number
  /** Whether the playlist takes part in the mix. */
  active: boolean
}

export const SHUFFLE_MODES: ShuffleMode[] = [
  'consecutive-random',
  'full-shuffle',
  'proportional',
  'sequential-blocks',
  'none',
]
