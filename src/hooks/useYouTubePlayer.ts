'use client'
import { useEffect } from 'react'
import { PLAYABLE_ERROR_CODES, PlayerState } from '../lib/youtube/player'
import { usePlayerBridge } from './usePlayerBridge'
import { usePlayerStore } from '../store/playerStore'

/**
 * Wires the YouTube IFrame events to the player store: state changes, auto-advance and
 * auto-skip of videos the API refuses to embed.
 */
export function useYouTubePlayer() {
  const { attachPlayer, controls } = usePlayerBridge()
  const currentId = usePlayerStore((state) => state.currentId)
  const repeat = usePlayerStore((state) => state.repeat)
  const setPlaying = usePlayerStore((state) => state.setPlaying)
  const setBuffering = usePlayerStore((state) => state.setBuffering)
  const pendingPlay = usePlayerStore((state) => state.pendingPlay)
  const setPendingPlay = usePlayerStore((state) => state.setPendingPlay)
  const setTime = usePlayerStore((state) => state.setTime)
  const onTrackEnded = usePlayerStore((state) => state.onTrackEnded)
  const next = usePlayerStore((state) => state.next)
  const markUnavailable = usePlayerStore((state) => state.markUnavailable)

  // A new video starts from zero; the duration is unknown until the iframe reports it.
  useEffect(() => {
    setTime(0, 0)
  }, [currentId, setTime])

  return {
    videoId: currentId ?? undefined,
    handlers: {
      onReady: (event: { target: unknown }) => {
        attachPlayer(event.target as Parameters<typeof attachPlayer>[0])
      },
      onStateChange: (event: { data: number }) => {
        if (event.data === PlayerState.CUED) {
          // The video is loaded but idle: start it when the user asked for playback.
          if (pendingPlay) {
            setPendingPlay(false)
            controls.play()
          }
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
        if (repeat === 'one') {
          controls.restart()
          return
        }
        onTrackEnded()
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
