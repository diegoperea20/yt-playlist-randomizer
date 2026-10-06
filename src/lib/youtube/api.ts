import { z } from 'zod'
import type { Track } from '../../types'
import { bestThumbnail, playlistItemsResponseSchema } from './schemas'

export type YoutubeErrorCode =
  | 'missing-api-key'
  | 'playlist-not-found'
  | 'playlist-not-accessible'
  | 'quota-exceeded'
  | 'forbidden'
  | 'unknown'

/** Localized stand-ins for the fields YouTube leaves out, resolved by the caller. */
export type TrackFallbacks = {
  untitled: string
  unknownChannel: string
}

/**
 * Error carrying a code instead of a message, so the UI can show a precise, actionable
 * error in the selected language. `message` is the code itself, which keeps the devtools
 * and any log readable without leaking a language into this layer.
 */
export class YoutubeApiError extends Error {
  readonly code: YoutubeErrorCode
  readonly status?: number

  constructor(code: YoutubeErrorCode, status?: number) {
    super(code)
    this.name = 'YoutubeApiError'
    this.code = code
    this.status = status
  }
}

const trackSchema = z.object({
  id: z.string(),
  title: z.string(),
  channel: z.string(),
  thumbnail: z.string(),
  durationSec: z.number(),
  playlistId: z.string(),
  available: z.boolean(),
})

const tracksResponseSchema = z.object({
  tracks: z.array(trackSchema),
})

const errorResponseSchema = z.object({
  code: z.string(),
})

/** Convert raw API items into tracks, dropping entries without a usable videoId. */
export function itemsToTracks(
  playlistId: string,
  items: z.infer<typeof playlistItemsResponseSchema>['items'],
  durations: Map<string, number>,
  fallbacks: TrackFallbacks,
): Track[] {
  const tracks: Track[] = []
  const seen = new Set<string>()

  for (const item of items) {
    const videoId = item.contentDetails?.videoId
    // Deleted, private or region-blocked entries come back without snippet/videoId.
    if (!videoId || seen.has(videoId)) continue
    seen.add(videoId)

    tracks.push({
      id: videoId,
      title: item.snippet?.title ?? fallbacks.untitled,
      channel: item.snippet?.channelTitle ?? fallbacks.unknownChannel,
      thumbnail: bestThumbnail(item.snippet?.thumbnails, videoId),
      durationSec: durations.get(videoId) ?? 0,
      playlistId,
      available: true,
    })
  }

  return tracks
}

/**
 * Client-side pipeline: the YouTube Data API key lives ONLY on the server
 * (`process.env.YOUTUBE_API_KEY` in `src/app/api/playlist/[id]/route.ts`).
 * The browser never sees the key; it just calls our own backend.
 */
export async function loadPlaylistTracks(
  playlistId: string,
  fallbacks: TrackFallbacks,
  signal?: AbortSignal,
): Promise<Track[]> {
  const params = new URLSearchParams({
    untitled: fallbacks.untitled,
    unknownChannel: fallbacks.unknownChannel,
  })
  const response = await fetch(
    `/api/playlist/${encodeURIComponent(playlistId)}?${params.toString()}`,
    { signal },
  )

  if (!response.ok) {
    let code = 'unknown'
    try {
      const body = errorResponseSchema.parse(await response.json())
      code = body.code
    } catch {
      // Non-JSON error bodies are ignored; the status code is enough.
    }
    throw new YoutubeApiError(code as YoutubeErrorCode, response.status)
  }

  const body = tracksResponseSchema.parse(await response.json())
  return body.tracks
}
