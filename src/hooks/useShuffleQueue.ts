'use client'
import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { generateQueue } from '../lib/shuffle'
import { useT } from '../i18n/useT'
import { activePlaylists, activeTrackCount, isMixReady } from '../store/playlistsSelectors'
import { usePlaylistsStore } from '../store/playlistsStore'
import { usePlayerStore } from '../store/playerStore'

/**
 * Build a new queue with the active mode and options, keeping the current track playing
 * when possible so re-shuffling never cuts the song that is already sounding.
 */
export function useShuffleQueue() {
  const { t } = useT()
  const playlists = usePlaylistsStore((state) => state.playlists)
  const tracks = usePlaylistsStore((state) => state.tracks)
  const mode = usePlaylistsStore((state) => state.mode)
  const dedupe = usePlaylistsStore((state) => state.dedupe)
  const reshuffleRounds = usePlaylistsStore((state) => state.reshuffleRounds)

  const currentId = usePlayerStore((state) => state.currentId)
  const setQueue = usePlayerStore((state) => state.setQueue)
  const setCurrentId = usePlayerStore((state) => state.setCurrentId)

  const active = useMemo(() => activePlaylists(playlists, tracks), [playlists, tracks])
  const trackCount = useMemo(() => activeTrackCount(playlists, tracks), [playlists, tracks])
  const ready = useMemo(() => isMixReady(playlists, tracks), [playlists, tracks])

  const shuffle = useCallback(() => {
    if (!ready) {
      toast.error(t('toast.noPlaylists'), { description: t('toast.noPlaylistsDescription') })
      return
    }

    const queue = generateQueue(mode, active, { dedupe, reshuffleRounds })
    if (queue.length === 0) {
      toast.error(t('toast.emptyMix'))
      return
    }

    // Keep listening to the same track if the new queue still contains it.
    const keepCurrent = currentId && queue.some((track) => track.id === currentId)
    setQueue(queue)
    if (!keepCurrent && currentId) setCurrentId(queue[0].id)

    toast.success(t('toast.queueGenerated', { count: queue.length }))
  }, [active, currentId, dedupe, mode, ready, reshuffleRounds, setCurrentId, setQueue, t])

  return { shuffle, ready, trackCount, mode }
}
