'use client'
import type { PersistStorage, StorageValue } from 'zustand/middleware'

/**
 * How long writes are coalesced before hitting storage.
 */
const WRITE_DELAY_MS = 400

/**
 * Persist middleware serializes and writes on *every* `set()`. The queue can hold thousands of
 * tracks, so a large playlist paid that cost several times a second just from the playback clock
 * ticking, and again on the frame a drag is dropped. Writes are coalesced here instead, flushed
 * before the page can go away, and skipped entirely when the persisted slice did not change
 * (e.g. clock ticks that keep the same `queue` reference).
 */
export function createDebouncedStorage<S>(
  getStorage: () => Storage,
  isEqual?: (a: StorageValue<S>, b: StorageValue<S>) => boolean,
): PersistStorage<S> {
  let timer: number | undefined
  let pending: { name: string; value: StorageValue<S> } | undefined
  let lastWritten: { name: string; value: StorageValue<S> } | undefined
  let listening = false

  const flush = () => {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
    if (!pending) return

    const { name, value } = pending
    pending = undefined
    lastWritten = { name, value }
    try {
      getStorage().setItem(name, JSON.stringify(value))
    } catch {
      // A full or unavailable storage must never break playback.
    }
  }

  const listenForFlush = () => {
    if (listening || typeof window === 'undefined') return
    listening = true
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', flush)
  }

  return {
    getItem: (name) => {
      const raw = getStorage().getItem(name)
      if (!raw) return null
      try {
        return JSON.parse(raw) as StorageValue<S>
      } catch {
        // Corrupted storage is treated as a fresh state instead of blocking startup.
        return null
      }
    },

    setItem: (name, value) => {
      listenForFlush()
      if (isEqual) {
        // A clock tick reuses the same persisted references: keep the pending write (if any)
        // and its timer untouched instead of serializing the whole queue again.
        if (pending && pending.name === name && isEqual(pending.value, value)) return
        if (!pending && lastWritten && lastWritten.name === name && isEqual(lastWritten.value, value)) {
          return
        }
      }
      pending = { name, value }
      if (timer !== undefined) clearTimeout(timer)
      timer = setTimeout(flush, WRITE_DELAY_MS) as unknown as number
    },

    removeItem: (name) => {
      if (timer !== undefined) clearTimeout(timer)
      timer = undefined
      if (pending?.name === name) pending = undefined
      if (lastWritten?.name === name) lastWritten = undefined
      getStorage().removeItem(name)
    },
  }
}
