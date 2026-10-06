'use client'
import { useEffect } from 'react'
import { usePlayerBridge } from './usePlayerBridge'
import { usePlayerStore } from '../store/playerStore'

/** Elements that swallow keyboard events so shortcuts must not fire. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  )
}

const SEEK_STEP = 5

/**
 * Keyboard shortcuts: Space play/pause, arrows to seek, Shift+arrows to change track,
 * M to mute and S to re-shuffle.
 */
export function useHotkeys(onShuffle: () => void) {
  const { controls } = usePlayerBridge()
  const next = usePlayerStore((state) => state.next)
  const previous = usePlayerStore((state) => state.previous)
  const toggleMute = usePlayerStore((state) => state.toggleMute)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (isTypingTarget(event.target)) return

      switch (event.key) {
        case ' ':
        case 'Spacebar':
          event.preventDefault()
          controls.togglePlay()
          break
        case 'ArrowRight':
          event.preventDefault()
          if (event.shiftKey) next()
          else controls.skip(SEEK_STEP)
          break
        case 'ArrowLeft':
          event.preventDefault()
          if (event.shiftKey) previous()
          else controls.skip(-SEEK_STEP)
          break
        case 'm':
        case 'M':
          event.preventDefault()
          toggleMute()
          break
        case 's':
        case 'S':
          event.preventDefault()
          onShuffle()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [controls, next, onShuffle, previous, toggleMute])
}
