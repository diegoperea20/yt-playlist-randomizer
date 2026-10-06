'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { YoutubeApiError, loadPlaylistTracks } from '../lib/youtube/api'
import { parsePlaylistUrl, playlistUrl } from '../lib/youtube/parseUrl'
import { readCachedTracks, writeCachedTracks } from '../lib/youtube/cache'
import { useT } from '../i18n/useT'
import { apiErrorKey, urlErrorKey } from '../i18n/keys'
import type { TranslationKey } from '../i18n/translate'
import { usePlaylistsStore } from '../store/playlistsStore'

const queryKey = (playlistId: string) => ['playlist', playlistId] as const

/** API failures carry a code, so the message is resolved here in the selected language. */
function errorMessage(
  error: unknown,
  t: (key: TranslationKey, values?: Record<string, string | number>) => string,
): string {
  if (error instanceof YoutubeApiError) {
    return t(apiErrorKey(error.code), { status: error.status ?? 0 })
  }
  if (error instanceof Error) return error.message
  return t('apiError.loadFailed')
}

/**
 * Owns the lifecycle of every playlist: parses and adds new URLs, serves the IndexedDB
 * cache first, loads the missing ones through the Data API and exposes manual refreshes.
 */
export function usePlaylistManager() {
  const queryClient = useQueryClient()
  const { t } = useT()
  const playlists = usePlaylistsStore((state) => state.playlists)
  const tracks = usePlaylistsStore((state) => state.tracks)
  const addPlaylist = usePlaylistsStore((state) => state.addPlaylist)
  const removePlaylist = usePlaylistsStore((state) => state.removePlaylist)
  const setTracks = usePlaylistsStore((state) => state.setTracks)
  const setStatus = usePlaylistsStore((state) => state.setStatus)
  const setError = usePlaylistsStore((state) => state.setError)
  // Network queries stay disabled until the IndexedDB cache has been read, so a reload
  // never fires a request for a playlist we already have.
  const [isHydrated, setIsHydrated] = useState(false)

  // YouTube omits some fields, and their stand-ins are part of the track once cached.
  const fallbacks = useMemo(
    () => ({ untitled: t('track.untitled'), unknownChannel: t('track.unknownChannel') }),
    [t],
  )

  // One query per playlist, enabled only when its tracks are not cached yet.
  const results = useQueries({
    queries: playlists.map((meta) => ({
      queryKey: queryKey(meta.id),
      enabled: isHydrated && !(tracks[meta.id]?.length > 0),
      queryFn: async ({ signal }: { signal: AbortSignal }) => {
        const cached = await readCachedTracks(meta.id)
        if (cached) setTracks(meta.id, cached)
        const loaded = await loadPlaylistTracks(meta.id, fallbacks, signal)
        await writeCachedTracks(meta.id, loaded)
        return loaded
      },
    })),
  })

  // Repopulate the runtime cache from IndexedDB before enabling any network query.
  useEffect(() => {
    let active = true
    void usePlaylistsStore
      .getState()
      .hydrateTracks()
      .finally(() => {
        if (active) setIsHydrated(true)
      })
    return () => {
      active = false
    }
  }, [])

  // Mirror the query results into the store. The setters no-op when nothing changed, so it
  // is safe that this effect runs on every render.
  useEffect(() => {
    playlists.forEach((meta, index) => {
      const result = results[index]
      if (!result) return

      if (result.isPending) {
        setStatus(meta.id, 'loading')
        return
      }
      if (result.isError) {
        setStatus(meta.id, 'error')
        setError(meta.id, errorMessage(result.error, t))
        return
      }
      if (result.data) {
        setStatus(meta.id, 'ready')
        setError(meta.id, '')
        setTracks(meta.id, result.data)
      }
    })
  }, [playlists, results, setError, setStatus, setTracks, t])

  const add = useCallback(
    (input: string) => {
      const parsed = parsePlaylistUrl(input)
      if (!parsed.ok) {
        toast.error(t('toast.invalidUrl'), {
          description: t(urlErrorKey(parsed.reason)),
        })
        return false
      }

      const isNew = addPlaylist({ id: parsed.playlistId, url: playlistUrl(parsed.playlistId) })
      toast.success(isNew ? t('toast.playlistAdded') : t('toast.playlistRefreshing'), {
        description: isNew ? t('toast.loadingTracks') : t('toast.rereadingList'),
      })
      return true
    },
    [addPlaylist, t],
  )

  const refresh = useCallback(
    (playlistId: string) => {
      setStatus(playlistId, 'idle')
      void queryClient.invalidateQueries({ queryKey: queryKey(playlistId) })
    },
    [queryClient, setStatus],
  )

  const refreshAll = useCallback(() => {
    for (const meta of playlists) refresh(meta.id)
  }, [playlists, refresh])

  const remove = useCallback(
    (playlistId: string) => {
      queryClient.removeQueries({ queryKey: queryKey(playlistId) })
      removePlaylist(playlistId)
      toast.message(t('toast.playlistRemoved'))
    },
    [queryClient, removePlaylist, t],
  )

  const isLoading = useMemo(() => results.some((result) => result.isPending), [results])

  return { add, remove, refresh, refreshAll, isLoading }
}
