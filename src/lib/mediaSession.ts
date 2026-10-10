'use client'
import { useEffect } from 'react'
import type { Track } from '../types'

export type MediaSessionHandlers = {
  play: () => void
  pause: () => void
  stop: () => void
  next: () => void
  previous: () => void
  seek: (seconds: number) => void
  seekBy: (deltaSeconds: number) => void
}

/**
 * Expose the playing track to the OS (keyboard media keys, lock screen, Bluetooth
 * controls). Purely progressive enhancement: unsupported browsers silently skip it.
 *
 * Metadata and action handlers live in separate effects so the keys stay registered
 * even with an empty queue and are never dropped while only the track changes.
 */
export function useMediaSession(track: Track | null, handlers: MediaSessionHandlers) {
  useEffect(() => {
    if (!('mediaSession' in navigator) || !track) return

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.channel,
        album: 'YT Randomizer',
        artwork: [{ src: track.thumbnail, sizes: '320x180', type: 'image/jpeg' }],
      })
    } catch {
      // Some browsers reject the artwork (e.g. wrong MIME/size).
    }
  }, [track])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return

    const { play, pause, stop, next, previous, seek, seekBy } = handlers
    const bindings: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => play()],
      ['pause', () => pause()],
      ['stop', () => stop()],
      ['nexttrack', () => next()],
      ['previoustrack', () => previous()],
      ['seekforward', (details) => seekBy(details.seekOffset ?? 10)],
      ['seekbackward', (details) => seekBy(-(details.seekOffset ?? 10))],
      [
        'seekto',
        (details) => {
          if (typeof details.seekTime === 'number') seek(details.seekTime)
        },
      ],
    ]

    for (const [action, handler] of bindings) {
      try {
        navigator.mediaSession.setActionHandler(action, handler)
      } catch {
        // Some actions are unsupported on some platforms.
      }
    }

    return () => {
      for (const [action] of bindings) {
        try {
          navigator.mediaSession.setActionHandler(action, null)
        } catch {
          // Ignored on cleanup.
        }
      }
    }
  }, [handlers])
}
