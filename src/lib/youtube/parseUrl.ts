const VALID_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'music.youtube.com',
  'm.youtube.com',
  'youtu.be',
]

/** Ids that the public Data API cannot read: auto-generated mixes and "Liked music". */
const UNSUPPORTED_PLAYLIST_IDS = ['LL', 'WL']

/**
 * Why a URL was rejected. It is a code rather than a message so the UI can render it in
 * the selected language; see `urlError.*` in the dictionaries.
 */
export type UrlErrorCode =
  | 'empty'
  | 'invalid-url'
  | 'unsupported-host'
  | 'missing-list-param'
  | 'not-a-playlist'
  | 'auto-mix'
  | 'liked-music'

export type ParsedPlaylistUrl =
  { ok: true; playlistId: string; videoId: string | null } | { ok: false; reason: UrlErrorCode }

/**
 * Extract the `list` id from a YouTube / YouTube Music URL.
 * Also returns the `v` id when the URL points to a specific video.
 */
export function parsePlaylistUrl(input: string): ParsedPlaylistUrl {
  const raw = input.trim()
  if (!raw) return { ok: false, reason: 'empty' }

  let url: URL
  try {
    url = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
  } catch {
    return { ok: false, reason: 'invalid-url' }
  }

  if (!VALID_HOSTS.includes(url.hostname)) {
    return { ok: false, reason: 'unsupported-host' }
  }

  const playlistId = url.searchParams.get('list')
  const videoId = url.searchParams.get('v')

  if (!playlistId) {
    if (url.pathname.startsWith('/playlist')) {
      return { ok: false, reason: 'missing-list-param' }
    }
    return { ok: false, reason: 'not-a-playlist' }
  }

  if (playlistId.startsWith('RD')) {
    return { ok: false, reason: 'auto-mix' }
  }

  if (UNSUPPORTED_PLAYLIST_IDS.includes(playlistId)) {
    return { ok: false, reason: 'liked-music' }
  }

  return { ok: true, playlistId, videoId }
}

/** Convenience wrapper around `parsePlaylistUrl` that only returns the playlist id. */
export function parsePlaylistId(input: string): string | null {
  const result = parsePlaylistUrl(input)
  return result.ok ? result.playlistId : null
}

/** Canonical, shareable URL for a playlist. */
export function playlistUrl(playlistId: string): string {
  return `https://www.youtube.com/playlist?list=${playlistId}`
}
