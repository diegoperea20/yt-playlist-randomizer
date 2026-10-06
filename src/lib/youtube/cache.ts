'use client'
import { get, set } from 'idb-keyval'
import type { Track } from '../../types'

/**
 * Playlists can hold hundreds of tracks, which is too much for the ~5 MB localStorage
 * budget, so cached tracks live in IndexedDB and only metadata is persisted.
 */
const STORE_KEY = 'yt-random-playlist-cache-v1'

type CacheEntry = {
  playlistId: string
  tracks: Track[]
  savedAt: number
}

async function readStore(): Promise<Record<string, CacheEntry>> {
  try {
    return (await get<Record<string, CacheEntry>>(STORE_KEY)) ?? {}
  } catch {
    // Private browsing modes can block IndexedDB; caching is a nice-to-have.
    return {}
  }
}

export async function readCachedTracks(playlistId: string): Promise<Track[] | null> {
  const entry = (await readStore())[playlistId]
  return entry?.tracks ?? null
}

export async function writeCachedTracks(playlistId: string, tracks: Track[]): Promise<void> {
  try {
    const store = await readStore()
    store[playlistId] = { playlistId, tracks, savedAt: Date.now() }
    await set(STORE_KEY, store)
  } catch {
    // Swallow quota/permission errors: the app keeps working without the cache.
  }
}

export async function clearCachedTracks(playlistId: string): Promise<void> {
  try {
    const store = await readStore()
    delete store[playlistId]
    await set(STORE_KEY, store)
  } catch {
    // Ignore: nothing to clean up if the cache is unavailable.
  }
}
