'use client'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { YTPlayerInstance } from '../lib/youtube/player'
import { PlayerState } from '../lib/youtube/player'
import { usePlayerStore } from '../store/playerStore'

/** Imperative controls shared by the video stage, the player bar and the shortcuts. */
export type PlayerControls = {
  play: () => void
  pause: () => void
  togglePlay: () => void
  /** Jump to an absolute position in seconds. */
  seek: (seconds: number) => void
  /** Move the position relative to the current one, used by the arrow keys. */
  skip: (deltaSeconds: number) => void
  restart: () => void
  getCurrentTime: () => number
  getDuration: () => number
  isReady: () => boolean
}

type PlayerBridge = {
  attachPlayer: (player: YTPlayerInstance | null) => void
  controls: PlayerControls
}

const PlayerBridgeContext = createContext<PlayerBridge | null>(null)

export function usePlayerBridge(): PlayerBridge {
  const bridge = useContext(PlayerBridgeContext)
  if (!bridge) throw new Error('usePlayerBridge must be used inside <PlayerBridgeProvider>')
  return bridge
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

/**
 * Holds the YouTube player instance outside of the video stage so any sibling component
 * (the bottom bar, the keyboard shortcuts, Media Session) can drive playback.
 */
export function PlayerBridgeProvider({ children }: { children: ReactNode }) {
  // State instead of a ref: the controls must always close over the live instance, and
  // reading a ref during render is exactly what the compiler lint forbids.
  const [player, setPlayer] = useState<YTPlayerInstance | null>(null)
  const volume = usePlayerStore((state) => state.volume)
  const muted = usePlayerStore((state) => state.muted)

  const attachPlayer = useCallback((instance: YTPlayerInstance | null) => {
    setPlayer(instance)
  }, [])

  const controls = useMemo<PlayerControls>(() => {
    /** The iframe can be mid-teardown, so every call goes through this guard. */
    const safely = (action: (instance: YTPlayerInstance) => void) => () => {
      if (!player) return
      try {
        action(player)
      } catch {
        // A rejected postMessage during teardown is harmless.
      }
    }

    return {
      play: safely((instance) => instance.playVideo()),
      pause: safely((instance) => instance.pauseVideo()),
      togglePlay: safely((instance) => {
        if (instance.getPlayerState() === PlayerState.PLAYING) instance.pauseVideo()
        else instance.playVideo()
      }),
      seek: (seconds) =>
        safely((instance) => {
          const duration = instance.getDuration() || 0
          instance.seekTo(clamp(seconds, 0, duration || Number.MAX_SAFE_INTEGER), true)
        })(),
      skip: (deltaSeconds) =>
        safely((instance) => {
          const duration = instance.getDuration() || 0
          const target = clamp(
            instance.getCurrentTime() + deltaSeconds,
            0,
            duration || deltaSeconds,
          )
          instance.seekTo(target, true)
        })(),
      restart: safely((instance) => {
        instance.seekTo(0, true)
        instance.playVideo()
      }),
      getCurrentTime: () => player?.getCurrentTime() ?? 0,
      getDuration: () => player?.getDuration() ?? 0,
      isReady: () => player !== null,
    }
  }, [player])

  // Push the persisted volume and mute preferences into the iframe.
  useEffect(() => {
    try {
      player?.setVolume(volume)
    } catch {
      // The player may be swapping videos.
    }
  }, [player, volume])

  useEffect(() => {
    if (!player) return
    try {
      if (muted) player.mute()
      else player.unMute()
    } catch {
      // The player may be swapping videos.
    }
  }, [muted, player])

  const value = useMemo(() => ({ attachPlayer, controls }), [attachPlayer, controls])

  return <PlayerBridgeContext.Provider value={value}>{children}</PlayerBridgeContext.Provider>
}
