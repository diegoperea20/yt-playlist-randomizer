import 'server-only'
import { z } from 'zod'
import { parseIsoDuration } from '../time'
import type { Track } from '../../types'
import { itemsToTracks, YoutubeApiError, type TrackFallbacks } from './api'
import { playlistItemsResponseSchema, videosResponseSchema } from './schemas'

const API_BASE = 'https://www.googleapis.com/youtube/v3'
const PAGE_SIZE = 50

/**
 * The key lives ONLY here on the server, read from `.env` (`YOUTUBE_API_KEY`).
 * Never import this module from client code; `server-only` fails the build if
 * that happens. Restrict the key by server IP in Google Cloud (not HTTP
 * referrer, since browsers never call Google directly anymore).
 */
export function getServerApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY?.replace(/^['"]|['"]$/g, '')
  if (!key) {
    throw new YoutubeApiError('missing-api-key')
  }
  return key
}

/** Map a Google API error payload onto our error codes. */
function toApiError(status: number, reason: string | undefined): YoutubeApiError {
  if (status === 404) {
    return new YoutubeApiError('playlist-not-found', status)
  }
  if (reason === 'playlistItemsNotAccessible' || reason === 'playlistNotAccessible') {
    return new YoutubeApiError('playlist-not-accessible', status)
  }
  if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded' || status === 429) {
    return new YoutubeApiError('quota-exceeded', status)
  }
  if (status === 403) {
    return new YoutubeApiError('forbidden', status)
  }
  return new YoutubeApiError('unknown', status)
}

async function requestYouTube<T>(
  path: string,
  params: Record<string, string>,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  const url = new URL(`${API_BASE}/${path}`)
  url.searchParams.set('key', getServerApiKey())
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url, { signal })
  if (!response.ok) {
    let reason: string | undefined
    try {
      const body = (await response.json()) as { error?: { errors?: { reason?: string }[] } }
      reason = body.error?.errors?.[0]?.reason
    } catch {
      // Non JSON error bodies are ignored; the status code is enough.
    }
    throw toApiError(response.status, reason)
  }

  return schema.parse(await response.json())
}

/** Fetch every item of a playlist, following `nextPageToken`. */
export async function fetchPlaylistItems(
  playlistId: string,
  signal?: AbortSignal,
): Promise<z.infer<typeof playlistItemsResponseSchema>['items']> {
  const items: z.infer<typeof playlistItemsResponseSchema>['items'] = []
  let pageToken: string | undefined

  do {
    const page = await requestYouTube(
      'playlistItems',
      {
        part: 'snippet,contentDetails',
        playlistId,
        maxResults: String(PAGE_SIZE),
        ...(pageToken ? { pageToken } : {}),
      },
      playlistItemsResponseSchema,
      signal,
    )
    items.push(...page.items)
    pageToken = page.nextPageToken ?? undefined
  } while (pageToken)

  return items
}

/** Durations cost 1 unit per call, so ids are batched 50 at a time. */
export async function fetchDurations(
  videoIds: string[],
  signal?: AbortSignal,
): Promise<Map<string, number>> {
  const durations = new Map<string, number>()
  const uniqueIds = [...new Set(videoIds)]

  for (let i = 0; i < uniqueIds.length; i += PAGE_SIZE) {
    const batch = uniqueIds.slice(i, i + PAGE_SIZE)
    const response = await requestYouTube(
      'videos',
      { part: 'contentDetails', id: batch.join(',') },
      videosResponseSchema,
      signal,
    )
    for (const item of response.items) {
      const duration = item.contentDetails?.duration
      if (item.id && duration) {
        durations.set(item.id, parseIsoDuration(duration))
      }
    }
  }

  return durations
}

/** Full server pipeline: items + durations -> tracks. */
export async function loadPlaylistTracksServer(
  playlistId: string,
  fallbacks: TrackFallbacks,
  signal?: AbortSignal,
): Promise<Track[]> {
  const items = await fetchPlaylistItems(playlistId, signal)
  const videoIds = items
    .map((item) => item.contentDetails?.videoId)
    .filter((id): id is string => Boolean(id))

  const durations = await fetchDurations(videoIds, signal)
  return itemsToTracks(playlistId, items, durations, fallbacks)
}
