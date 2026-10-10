/**
 * Minimal shape of the YouTube IFrame Player we rely on.
 * `react-youtube` ships types that point at a `youtube-player/dist/types` file which is
 * not present in the installed version, so the instance is typed locally instead.
 */
export type YTPlayerInstance = {
  playVideo: () => void
  pauseVideo: () => void
  loadVideoById: (videoId: string | { videoId: string; startSeconds?: number }) => void
  cueVideoById: (videoId: string | { videoId: string; startSeconds?: number }) => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  getCurrentTime: () => number
  getDuration: () => number
  getVolume: () => number
  getPlayerState: () => number
  setVolume: (volume: number) => void
  mute: () => void
  unMute: () => void
  isMuted: () => boolean
  getIframe?: () => HTMLIFrameElement
}

/** `YT.PlayerState` values used by the app. */
export const PlayerState = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const

/** `YT.PlayerState` error codes: private/deleted, embedding disabled by the owner, etc. */
export const PlayerError = {
  INVALID_PARAMETER: 2,
  EMBEDDING_DISABLED: 101,
  NOT_PLAYABLE: 150,
  NOT_FOUND: 100,
} as const

export const PLAYABLE_ERROR_CODES: number[] = [
  PlayerError.INVALID_PARAMETER,
  PlayerError.EMBEDDING_DISABLED,
  PlayerError.NOT_PLAYABLE,
  PlayerError.NOT_FOUND,
]

/** Player options: our own bar provides the controls, so the native ones are hidden. */
export const PLAYER_VARS = {
  autoplay: 0,
  controls: 0,
  modestbranding: 1,
  rel: 0,
  playsinline: 1,
  enablejsapi: 1,
  disablekb: 1,
  iv_load_policy: 3,
} as const
