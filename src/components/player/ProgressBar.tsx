'use client'
import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { formatTime } from '../../lib/time'
import { usePlayerBridge } from '../../hooks/usePlayerBridge'
import { useT } from '../../i18n/useT'
import { usePlayerStore } from '../../store/playerStore'

const SEEK_STEP = 5

/**
 * Seek bar with click and drag support, mirroring the player's own progress.
 *
 * Hovering and dragging paint the bar imperatively through refs on purpose: storing the
 * pointer position in state would re-render on every single mouse move, which froze the
 * progress while the cursor was over the bar.
 */
export function ProgressBar() {
  const { t } = useT()
  const { controls } = usePlayerBridge()
  const currentTime = usePlayerStore((state) => state.currentTime)
  const duration = usePlayerStore((state) => state.duration)

  const barRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const elapsedRef = useRef<HTMLSpanElement>(null)
  const isDraggingRef = useRef(false)
  /** Last position painted by the pointer, replayed after each render. */
  const interactionRef = useRef<{ ratio: number; seconds: number } | null>(null)
  /** True while waiting for the player to catch up with the position just dropped. */
  const awaitingSeekRef = useRef(false)

  const progress = duration > 0 ? Math.min(Math.max(currentTime / duration, 0), 1) : 0

  /** Draw a position on the bar without going through React state. */
  const paint = useCallback((ratio: number, seconds: number) => {
    const clamped = Math.min(Math.max(ratio, 0), 1)
    const percent = `${clamped * 100}%`

    if (fillRef.current) fillRef.current.style.width = percent
    if (thumbRef.current) thumbRef.current.style.left = `calc(${percent} - 6px)`
    if (elapsedRef.current) elapsedRef.current.textContent = formatTime(seconds)
  }, [])

  // The playback ticker re-renders every 250 ms and React would rewrite the inline styles,
  // so the pointer position is repainted right after each render.
  useEffect(() => {
    const interaction = interactionRef.current
    if (!interaction) return

    // After releasing a seek, the bar keeps showing the requested position until the
    // player actually gets there; painting the stale one made it jump backwards.
    if (awaitingSeekRef.current && Math.abs(progress - interaction.ratio) < 0.02) {
      interactionRef.current = null
      awaitingSeekRef.current = false
      return
    }

    paint(interaction.ratio, interaction.seconds)
  })

  /** Go back to the real playback position. */
  const restore = useCallback(() => {
    paint(progress, currentTime)
  }, [currentTime, paint, progress])

  const ratioFromEvent = useCallback((clientX: number) => {
    const bar = barRef.current
    if (!bar) return 0
    const rect = bar.getBoundingClientRect()
    if (rect.width === 0) return 0
    return Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
  }, [])

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    // Capturing the pointer keeps receiving moves outside the bar while dragging.
    event.currentTarget.setPointerCapture(event.pointerId)
    isDraggingRef.current = true

    const total = controls.getDuration() || duration
    const ratio = ratioFromEvent(event.clientX)
    interactionRef.current = { ratio, seconds: ratio * total }
    controls.seek(ratio * total)
    paint(ratio, ratio * total)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const ratio = ratioFromEvent(event.clientX)
    const total = controls.getDuration() || duration
    const seconds = ratio * total

    interactionRef.current = { ratio, seconds }
    // Dragging seeks; hovering only previews the target position.
    if (isDraggingRef.current) controls.seek(seconds)
    paint(ratio, seconds)
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    const wasDragging = isDraggingRef.current
    isDraggingRef.current = false

    // Leaving the bar must not undo a seek that has not landed yet.
    if (wasDragging || awaitingSeekRef.current) {
      awaitingSeekRef.current = true
      return
    }

    // A plain hover leaves the bar: hand the display back to the real playback position.
    interactionRef.current = null
    restore()
  }

  return (
    <div className="flex items-center gap-3">
      <span
        ref={elapsedRef}
        className="text-content-muted w-10 text-right font-mono text-[11px] tabular-nums"
      >
        {formatTime(currentTime)}
      </span>

      <div
        ref={barRef}
        role="slider"
        tabIndex={0}
        aria-label={t('player.position')}
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(currentTime)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        // Leaving the bar hands the display back to the real playback position.
        onPointerLeave={handlePointerUp}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') {
            event.preventDefault()
            controls.skip(SEEK_STEP)
          }
          if (event.key === 'ArrowLeft') {
            event.preventDefault()
            controls.skip(-SEEK_STEP)
          }
        }}
        className="group relative flex h-4 flex-1 cursor-pointer touch-none items-center"
      >
        <div className="bg-surface-hover absolute h-1 w-full overflow-hidden rounded-full">
          <div
            ref={fillRef}
            className="bg-brand h-full rounded-full"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div
          ref={thumbRef}
          className="bg-content-primary absolute size-3 rounded-full opacity-0 shadow transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          style={{ left: `calc(${progress * 100}% - 6px)` }}
        />
      </div>

      <span className="text-content-muted w-10 font-mono text-[11px] tabular-nums">
        {formatTime(duration)}
      </span>
    </div>
  )
}
