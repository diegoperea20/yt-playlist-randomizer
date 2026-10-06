import type { LoadStatus } from '../store/playlistsStore'
import type { RepeatMode, ShuffleMode } from '../types'
import type { YoutubeErrorCode } from '../lib/youtube/api'
import type { UrlErrorCode } from '../lib/youtube/parseUrl'
import type { TranslationKey } from './translate'

/**
 * Dictionary keys built from a union. TypeScript cannot check an interpolated path against
 * the key union, so the cast lives here once instead of at every call site: every code in
 * these unions is a key of the corresponding dictionary entry, which `en.ts` enforces.
 */
export const modeKey = (mode: ShuffleMode, field: 'label' | 'description') =>
  `mode.modes.${mode}.${field}` as TranslationKey

export const repeatKey = (repeat: RepeatMode) => `player.repeat.${repeat}` as TranslationKey

export const loadStatusKey = (status: LoadStatus) => `playlists.status.${status}` as TranslationKey

export const urlErrorKey = (code: UrlErrorCode) => `urlError.${code}` as TranslationKey

export const apiErrorKey = (code: YoutubeErrorCode) => `apiError.${code}` as TranslationKey
