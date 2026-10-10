'use client'
import { useCallback, useEffect, useRef } from 'react'
import { PLAYABLE_ERROR_CODES, PlayerState } from '../lib/youtube/player'
import { usePlayerBridge } from './usePlayerBridge'
import { usePlayerStore } from '../store/playerStore'

/**
 * Wires the YouTube IFrame events to the player store: state changes, auto-advance and
 * auto-skip of videos the API refuses to embed.
 *
 * Background-tab robustness: the advance path is sticky (a blocked `play()` in a hidden
 * Chromium tab is retried instead of dropped) and `ENDED` is also observed via
 * `onStateChange` plus a stall watchdog, not only via `onEnd`.
 */
export function useYouTubePlayer() {
  const { attachPlayer, controls } = usePlayerBridge()
  const currentId = usePlayerStore((state) => state.currentId)
  const setPlaying = usePlayerStore((state) => state.setPlaying)
  const setBuffering = usePlayerStore((state) => state.setBuffering)
  const pendingPlay = usePlayerStore((state) => state.pendingPlay)
  const setTime = usePlayerStore((state) => state.setTime)
  const next = usePlayerStore((state) => state.next)
  const markUnavailable = usePlayerStore((state) => state.markUnavailable)

  // `react-youtube` fires both `onStateChange(ENDED)` and `onEnd` for the same natural
  // end, and the stall watchdog can also observe the lingering ENDED state right after
  // advancing: all three funnel into one guarded handler. Echoes within a short window
  // are ignored — no legitimate second end can happen that fast (the watchdog alone
  // needs ~3 s stalled), while the previous id-based guard failed because the store
  // id has already moved to the next track when the echo arrives.
  const lastAdvanceAt = useRef(0)

  const handleEnded = useCallback(() => {
    const now = Date.now()
    if (now - lastAdvanceAt.current < 2000) return
    lastAdvanceAt.current = now
    const state = usePlayerStore.getState()
    if (!state.currentId) return
    if (state.repeat === 'one') {
      state.setPendingPlay(true)
      controls.restart()
      return
    }
    state.onTrackEnded()
  }, [controls])

  // A new video starts from zero; the duration is unknown until the iframe reports it.
  useEffect(() => {
    setTime(0, 0)
  }, [currentId, setTime])

  // The player instance is persistent across tracks (see VideoStage): advances load the
  // next video imperatively in a single autoplay step instead of destroying/recreating
  // the iframe per track, which is what stalls in hidden Chromium tabs. The very first
  // video is already loaded by the player creation itself, so it is only recorded.
  const lastLoadedRef = useRef<string | null>(null)
  useEffect(() => {
    if (!currentId) {
      lastLoadedRef.current = null
      return
    }
    if (lastLoadedRef.current === null) {
      lastLoadedRef.current = currentId
      return
    }
    if (lastLoadedRef.current !== currentId) {
      lastLoadedRef.current = currentId
      controls.load(currentId)
    }
  }, [controls, currentId])

  // A `play()` issued while the tab is hidden can be blocked/differed by Chromium and
  // `pendingPlay` is only cleared on PLAYING now, so keep retrying: twice on a timer
  // and every time the tab becomes visible again or regains focus.
  useEffect(() => {
    if (!pendingPlay || typeof window === 'undefined') return
    let cancelled = false
    const attempt = () => {
      if (cancelled || !usePlayerStore.getState().pendingPlay) return
      controls.play()
    }
    attempt()
    const first = window.setTimeout(attempt, 800)
    const second = window.setTimeout(attempt, 2500)
    const onVisible = () => {
      if (document.visibilityState === 'visible') attempt()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      cancelled = true
      window.clearTimeout(first)
      window.clearTimeout(second)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [controls, pendingPlay])

  // Stall watchdog: if the ENDED event is lost to background throttling but the clock
  // shows the track exhausted for ~3 consecutive seconds while PLAYING, force the
  // advance. In the foreground the event fires within milliseconds, so the counter
  // never reaches the threshold and nothing is cut short.
  useEffect(() => {
    if (!currentId || typeof window === 'undefined') return
    let stalled = 0
    const timer = window.setInterval(() => {
      try {
        const playerState = controls.getPlayerState()
        if (playerState === PlayerState.ENDED) {
          stalled = 0
          handleEnded()
          return
        }
        if (playerState === PlayerState.PLAYING) {
          const current = controls.getCurrentTime()
          const duration = controls.getDuration()
          if (
            Number.isFinite(current) &&
            Number.isFinite(duration) &&
            duration > 0 &&
            duration - current <= 1
          ) {
            stalled += 1
            if (stalled >= 3) {
              stalled = 0
              handleEnded()
            }
            return
          }
        }
        stalled = 0
      } catch {
        // The iframe can be mid-teardown; the next tick retries.
      }
    }, 1000)
    return () => window.clearInterval(timer)
  }, [controls, currentId, handleEnded])

  return {
    videoId: currentId ?? undefined,
    handlers: {
      onReady: (event: { target: unknown }) => {
        attachPlayer(event.target as Parameters<typeof attachPlayer>[0])
      },
      onStateChange: (event: { data: number }) => {
        if (event.data === PlayerState.ENDED) {
          handleEnded()
          return
        }
        if (event.data === PlayerState.CUED) {
          // The video is loaded but idle: start it when playback was requested.
          // `pendingPlay` stays set until PLAYING so a background-blocked `play()`
          // is retried by the effect above instead of being dropped.
          if (usePlayerStore.getState().pendingPlay) controls.play()
          return
        }
        if (event.data === PlayerState.PLAYING) {
          setPlaying(true)
          setBuffering(false)
        } else if (event.data === PlayerState.BUFFERING) {
          setBuffering(true)
        } else if (event.data === PlayerState.PAUSED) {
          setPlaying(false)
        }
      },
      onEnd: () => {
        handleEnded()
      },
      onError: (event: { data: number }) => {
        if (!PLAYABLE_ERROR_CODES.includes(event.data)) return
        if (currentId) markUnavailable(currentId)
        // Keep the mix going: jump to the next candidate.
        next()
      },
    },
  }
}
