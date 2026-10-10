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
 * M to mute and S to re-shuffle. Hardware media keys (play/pause, next, previous,
 * stop) are handled too for when the tab is focused; global/background media keys
 * go through the Media Session API instead (see `lib/mediaSession.ts`).
 */
export function useHotkeys(onShuffle: () => void) {
  const { controls } = usePlayerBridge()
  const next = usePlayerStore((state) => state.next)
  const previous = usePlayerStore((state) => state.previous)
  const toggleMute = usePlayerStore((state) => state.toggleMute)
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const setPendingPlay = usePlayerStore((state) => state.setPendingPlay)

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
        case 'MediaPlayPause': {
          if (usePlayerStore.getState().queue.length === 0) return
          event.preventDefault()
          // Same intent handling as the player bar button.
          if (isPlaying) {
            controls.pause()
            setPendingPlay(false)
          } else {
            if (controls.isReady()) controls.play()
            setPendingPlay(true)
          }
          break
        }
        case 'MediaTrackNext': {
          if (usePlayerStore.getState().queue.length === 0) return
          event.preventDefault()
          const before = usePlayerStore.getState().currentId
          next()
          if (usePlayerStore.getState().currentId !== before) setPendingPlay(true)
          break
        }
        case 'MediaTrackPrevious': {
          if (usePlayerStore.getState().queue.length === 0) return
          event.preventDefault()
          const before = usePlayerStore.getState().currentId
          previous()
          if (usePlayerStore.getState().currentId !== before) setPendingPlay(true)
          break
        }
        case 'MediaStop':
          event.preventDefault()
          controls.pause()
          setPendingPlay(false)
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [controls, isPlaying, next, onShuffle, previous, setPendingPlay, toggleMute])
}
