'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Maximize2, Minimize2, Music2, RectangleHorizontal } from 'lucide-react'

// react-youtube touches window on load, so it only renders on the client.
const YouTube = dynamic(() => import('react-youtube'), { ssr: false })
import { PLAYER_VARS } from '../../lib/youtube/player'
import { useYouTubePlayer } from '../../hooks/useYouTubePlayer'
import { usePlayerBridge } from '../../hooks/usePlayerBridge'
import { useT } from '../../i18n/useT'
import { usePlayerStore } from '../../store/playerStore'
import { Button } from '../ui/button'
import { EmptyState } from '../ui/primitives'
import { Tooltip } from '../ui/tooltip'

/** Central panel: the YouTube iframe plus cinema/fullscreen controls. */
export function VideoStage() {
  const { t } = useT()
  const { videoId, handlers } = useYouTubePlayer()
  const { controls } = usePlayerBridge()
  const currentId = usePlayerStore((state) => state.currentId)
  const isBuffering = usePlayerStore((state) => state.isBuffering)
  const setTime = usePlayerStore((state) => state.setTime)
  const isPlaying = usePlayerStore((state) => state.isPlaying)

  const stageRef = useRef<HTMLDivElement>(null)
  const [isTheater, setIsTheater] = useState(false)

  const track = useCurrentTrack()

  // The IFrame API has no time events, so the progress is polled while playing.
  useEffect(() => {
    if (!isPlaying) return
    const timer = window.setInterval(() => {
      const current = controls.getCurrentTime()
      const duration = controls.getDuration()
      if (Number.isFinite(current) && duration > 0) setTime(current, duration)
    }, 250)
    return () => window.clearInterval(timer)
  }, [controls, isPlaying, setTime])

  // The total duration is only known once the video is cued, so it is polled right after
  // loading a track as well; otherwise the bar would show 0:00 / 0:00 until playing.
  useEffect(() => {
    if (!currentId) return

    let attempts = 0
    const timer = window.setInterval(() => {
      const duration = controls.getDuration()
      if (Number.isFinite(duration) && duration > 0) {
        setTime(controls.getCurrentTime(), duration)
        window.clearInterval(timer)
        return
      }
      // Give up after ~10 s so a broken embed does not poll forever.
      if (attempts >= 40) window.clearInterval(timer)
      attempts++
    }, 250)

    return () => window.clearInterval(timer)
  }, [controls, currentId, setTime])

  const toggleFullscreen = () => {
    if (!stageRef.current) return
    if (document.fullscreenElement) void document.exitFullscreen()
    else void stageRef.current.requestFullscreen()
  }

  return (
    <div
      ref={stageRef}
      className={
        isTheater
          ? 'bg-black relative flex min-h-0 w-full flex-1 flex-col'
          : 'panel relative flex min-h-0 w-full flex-1 flex-col overflow-hidden'
      }
    >
      <div className="bg-black relative min-h-0 flex-1">
        {currentId ? (
          <YouTube
            videoId={videoId}
            className="h-full w-full"
            iframeClassName="h-full w-full"
            title={track?.title ?? t('player.youtubePlayer')}
            opts={{ playerVars: { ...PLAYER_VARS } }}
            onReady={handlers.onReady}
            onStateChange={handlers.onStateChange}
            onEnd={handlers.onEnd}
            onError={handlers.onError}
          />
        ) : (
          <div className="flex h-full min-h-52 flex-col items-center justify-center overflow-y-auto px-4 sm:min-h-60">
            <EmptyState
              compact
              icon={<Music2 />}
              title={t('player.emptyTitle')}
              description={t('player.emptyDescription', { shuffle: t('header.shuffle') })}
            />
          </div>
        )}

        {isBuffering && currentId ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="border-line-subtle border-t-brand size-10 animate-spin rounded-full border-2" />
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4">
        <div className="min-w-0">
          <p className="text-content-primary truncate text-sm font-medium">{track?.title ?? '—'}</p>
          <p className="text-content-muted truncate text-xs">{track?.channel ?? ''}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Tooltip label={isTheater ? t('player.exitTheater') : t('player.theater')}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsTheater((value) => !value)}
              aria-label={isTheater ? t('player.exitTheater') : t('player.theater')}
              aria-pressed={isTheater}
              className={isTheater ? 'text-brand' : undefined}
            >
              {isTheater ? <Minimize2 /> : <RectangleHorizontal />}
            </Button>
          </Tooltip>
          <Tooltip label={t('player.fullscreen')}>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              aria-label={t('player.fullscreen')}
            >
              <Maximize2 />
            </Button>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

/** The playing track taken from the queue, so the stage can label the video. */
function useCurrentTrack() {
  const queue = usePlayerStore((state) => state.queue)
  const currentId = usePlayerStore((state) => state.currentId)
  return useMemo(() => queue.find((track) => track.id === currentId) ?? null, [queue, currentId])
}
