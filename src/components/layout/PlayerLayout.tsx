'use client'
import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { VideoStage } from '../player/VideoStage'
import { PlayerBar } from '../player/PlayerBar'
import { QueuePanel } from '../queue/QueuePanel'
import { usePlaylistManager } from '../../hooks/usePlaylistManager'
import { useShuffleQueue } from '../../hooks/useShuffleQueue'
import { useHotkeys } from '../../hooks/useHotkeys'
import { useMediaSession } from '../../lib/mediaSession'
import { usePlayerBridge } from '../../hooks/usePlayerBridge'
import { DESKTOP_QUERY, useMediaQuery } from '../../hooks/useMediaQuery'
import { useT } from '../../i18n/useT'
import { usePlayerStore } from '../../store/playerStore'

type Sheet = 'playlists' | 'queue' | null

/** Three-column layout on desktop; the side panels become sheets on small screens. */
export function PlayerLayout() {
  const { t } = useT()
  const { add, remove, refresh, refreshAll, isLoading } = usePlaylistManager()
  const { shuffle, trackCount, ready } = useShuffleQueue()
  const { controls } = usePlayerBridge()

  const queue = usePlayerStore((state) => state.queue)
  const currentId = usePlayerStore((state) => state.currentId)
  const next = usePlayerStore((state) => state.next)
  const previous = usePlayerStore((state) => state.previous)
  const currentTime = usePlayerStore((state) => state.currentTime)
  const isPlaying = usePlayerStore((state) => state.isPlaying)

  const [sheet, setSheet] = useState<Sheet>(null)
  // The sidebar and the queue exist either in the desktop grid or in a bottom sheet, never
  // in both: mounting them twice would duplicate ids and double the DOM.
  const isDesktop = useMediaQuery(DESKTOP_QUERY)

  useHotkeys(shuffle)

  const current = useMemo(
    () => queue.find((track) => track.id === currentId) ?? null,
    [queue, currentId],
  )

  const mediaHandlers = useMemo(
    () => ({
      play: controls.play,
      pause: controls.pause,
      next,
      previous,
      seek: controls.seek,
      seekBy: controls.skip,
    }),
    [controls, next, previous],
  )

  useMediaSession(current, mediaHandlers)

  // Keep the OS scrubber in sync with the poll-driven position.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    try {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
    } catch {
      // Unsupported on some platforms.
    }
    if (!navigator.mediaSession.setPositionState) return
    const duration = controls.getDuration()
    if (!Number.isFinite(duration) || duration <= 0) return

    try {
      navigator.mediaSession.setPositionState({
        duration,
        position: Math.min(currentTime, duration),
        playbackRate: 1,
      })
    } catch {
      // Some browsers throw while the iframe is still loading.
    }
  }, [controls, currentTime, isPlaying])

  const sidebar = (
    <Sidebar
      onAdd={add}
      isLoading={isLoading}
      onRefresh={refresh}
      onRefreshAll={refreshAll}
      onRemove={remove}
    />
  )

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Header
        onShuffle={shuffle}
        trackCount={trackCount}
        isReady={ready}
        onOpenPlaylists={() => setSheet('playlists')}
        onOpenQueue={() => setSheet('queue')}
      />

      <main className="mx-auto grid min-h-0 w-full flex-1 gap-3 p-3 sm:p-4 lg:grid-cols-[320px_minmax(0,1fr)_340px] 2xl:max-w-[1600px]">
        {isDesktop ? <aside className="panel flex min-h-0 flex-col">{sidebar}</aside> : null}

        <section className="flex min-h-0 flex-col gap-3">
          <div className="flex min-h-0 flex-1 flex-col">
            <VideoStage />
          </div>
          <p className="panel text-content-muted hidden px-4 py-2 text-xs lg:block">
            {t('hotkeys.title')} <kbd className="text-content-secondary">{t('hotkeys.space')}</kbd>{' '}
            {t('hotkeys.playPause')} · <kbd className="text-content-secondary">←</kbd>/
            <kbd className="text-content-secondary">→</kbd> {t('hotkeys.seek')} ·{' '}
            <kbd className="text-content-secondary">Shift</kbd> + {t('hotkeys.changeTrack')} ·{' '}
            <kbd className="text-content-secondary">M</kbd> {t('hotkeys.mute')} ·{' '}
            <kbd className="text-content-secondary">S</kbd> {t('hotkeys.reshuffle')}
          </p>
        </section>

        {isDesktop ? (
          <div className="flex min-h-0 flex-col">
            <QueuePanel />
          </div>
        ) : null}
      </main>

      <PlayerBar />

      {/* Below `lg` the side panels become bottom sheets, and only one copy is mounted. */}
      {!isDesktop ? (
        <>
          <Dialog
            open={sheet === 'playlists'}
            onOpenChange={(open) => setSheet(open ? 'playlists' : null)}
          >
            <DialogContent>
              <DialogTitle className="sr-only">{t('playlists.sheetTitle')}</DialogTitle>
              <DialogDescription className="sr-only">
                {t('playlists.sheetDescription')}
              </DialogDescription>
              {sidebar}
            </DialogContent>
          </Dialog>

          <Dialog open={sheet === 'queue'} onOpenChange={(open) => setSheet(open ? 'queue' : null)}>
            {/* Top padding clears the floating close button above the queue header. */}
            <DialogContent className="pt-12">
              <DialogTitle className="sr-only">{t('queue.sheetTitle')}</DialogTitle>
              <DialogDescription className="sr-only">
                {t('queue.sheetDescription')}
              </DialogDescription>
              <div className="h-[80dvh]">
                <QueuePanel />
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  )
}
