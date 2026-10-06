'use client'
import { useMemo } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from 'lucide-react'
import { usePlayerBridge } from '../../hooks/usePlayerBridge'
import { useShuffleQueue } from '../../hooks/useShuffleQueue'
import { repeatKey } from '../../i18n/keys'
import { useT } from '../../i18n/useT'
import { usePlayerStore } from '../../store/playerStore'
import { Button } from '../ui/button'
import { Tooltip } from '../ui/tooltip'
import { ProgressBar } from './ProgressBar'
import { VolumeControl } from './VolumeControl'

/** Fixed bottom bar with the full set of playback controls. */
export function PlayerBar() {
  const { t } = useT()
  const { controls } = usePlayerBridge()
  const { shuffle } = useShuffleQueue()

  const queue = usePlayerStore((state) => state.queue)
  const currentId = usePlayerStore((state) => state.currentId)
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const isBuffering = usePlayerStore((state) => state.isBuffering)
  const repeat = usePlayerStore((state) => state.repeat)
  const expanded = usePlayerStore((state) => state.expanded)
  const setExpanded = usePlayerStore((state) => state.setExpanded)
  const next = usePlayerStore((state) => state.next)
  const previous = usePlayerStore((state) => state.previous)
  const cycleRepeat = usePlayerStore((state) => state.cycleRepeat)
  const setPendingPlay = usePlayerStore((state) => state.setPendingPlay)

  const current = useMemo(
    () => queue.find((track) => track.id === currentId) ?? null,
    [queue, currentId],
  )
  const isEmpty = queue.length === 0

  /** Browsers require a gesture to start playback, and the iframe needs to be cued. */
  const handlePlayPause = () => {
    if (isEmpty) return
    if (isPlaying) {
      controls.pause()
      setPendingPlay(false)
      return
    }
    if (controls.isReady()) controls.play()
    setPendingPlay(true)
  }

  return (
    <div className="bg-surface-raised border-line-subtle border-t">
      {expanded ? (
        <div className="px-4 pt-2.5 pb-1">
          <ProgressBar />
        </div>
      ) : null}

      <div className="flex items-center gap-2 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:gap-3 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
          <div className="bg-surface-overlay hidden size-10 shrink-0 overflow-hidden rounded-md min-[420px]:block">
            {current ? (
              <img
                src={current.thumbnail}
                alt=""
                className="size-full object-cover"
                loading="lazy"
              />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="text-content-primary truncate text-sm font-medium">
              {current?.title ?? t('player.nothingPlaying')}
            </p>
            <p className="text-content-muted truncate text-xs">{current?.channel ?? ''}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          {/* The header already shuffles on small screens, so this one stays for sm+. */}
          <Tooltip label={t('player.shuffleTooltip')}>
            <Button
              variant="ghost"
              size="icon"
              onClick={shuffle}
              aria-label={t('player.shuffleQueue')}
              className="hidden sm:inline-flex"
            >
              <Shuffle />
            </Button>
          </Tooltip>

          <Tooltip label={t('player.previousTooltip')}>
            <Button
              variant="ghost"
              size="icon"
              onClick={previous}
              disabled={isEmpty}
              aria-label={t('player.previous')}
            >
              <SkipBack />
            </Button>
          </Tooltip>

          <Button
            variant="brand"
            size="icon"
            onClick={handlePlayPause}
            disabled={isEmpty}
            aria-label={isPlaying ? t('player.pause') : t('player.play')}
            className="size-10 sm:size-9"
          >
            {isBuffering ? <Loader2 className="animate-spin" /> : isPlaying ? <Pause /> : <Play />}
          </Button>

          <Tooltip label={t('player.nextTooltip')}>
            <Button
              variant="ghost"
              size="icon"
              onClick={next}
              disabled={isEmpty}
              aria-label={t('player.next')}
            >
              <SkipForward />
            </Button>
          </Tooltip>

          <Tooltip label={t(repeatKey(repeat))}>
            <Button
              variant="ghost"
              size="icon"
              onClick={cycleRepeat}
              aria-label={t(repeatKey(repeat))}
              aria-pressed={repeat !== 'off'}
              className={repeat !== 'off' ? 'text-brand' : undefined}
            >
              {repeat === 'one' ? <Repeat1 /> : <Repeat />}
            </Button>
          </Tooltip>
        </div>

        <div className="hidden flex-1 items-center justify-end gap-2 md:flex">
          {expanded ? <VolumeControl /> : null}
          <Tooltip label={expanded ? t('player.collapseBarTooltip') : t('player.expandBarTooltip')}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? t('player.collapseBar') : t('player.expandBar')}
              aria-expanded={expanded}
            >
              {expanded ? <ChevronDown /> : <ChevronUp />}
            </Button>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
