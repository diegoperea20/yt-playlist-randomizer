'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { toast } from 'sonner'
import { arrayMove } from '@dnd-kit/sortable'
import { createDebouncedStorage } from '../lib/debouncedStorage'
import { getClientStorage } from '../lib/noopStorage'
import { translate } from '../i18n/translate'
import { useSettingsStore } from './settingsStore'
import type { RepeatMode, Track } from '../types'

type PlayerState = {
  queue: Track[]
  /** Source of truth for the playing track: reordering never invalidates the index. */
  currentId: string | null
  isPlaying: boolean
  isBuffering: boolean
  volume: number
  muted: boolean
  repeat: RepeatMode
  currentTime: number
  duration: number
  /** Set when playback should start as soon as the iframe has cued the new video. */
  pendingPlay: boolean
  /** false = compact mini bar, true = full bar with progress and volume. */
  expanded: boolean

  setQueue: (queue: Track[]) => void
  clearQueue: () => void
  setCurrentId: (id: string | null, autoplay?: boolean) => void
  next: () => void
  previous: () => void
  /** Called when a track finishes: honours repeat and stops at the end when repeat is off. */
  onTrackEnded: () => void

  setPlaying: (isPlaying: boolean) => void
  setBuffering: (isBuffering: boolean) => void
  setPendingPlay: (pendingPlay: boolean) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  cycleRepeat: () => void
  setExpanded: (expanded: boolean) => void
  setTime: (currentTime: number, duration: number) => void

  removeAt: (index: number) => void
  moveTrack: (from: number, to: number) => void
  /** Move a track right after the current one. */
  playNext: (index: number) => void
  moveToEnd: (index: number) => void
  markUnavailable: (id: string) => void
}

const REPEAT_ORDER: RepeatMode[] = ['off', 'all', 'one']

/** Subset of the state that is actually persisted (see `partialize` below). */
type PersistedPlayerState = Pick<
  PlayerState,
  'queue' | 'currentId' | 'volume' | 'muted' | 'repeat'
>

/**
 * The playback clock (`setTime`) fires several times a second while keeping the same `queue`
 * reference. Without this, every tick would reschedule (and eventually pay) a full-queue
 * serialization, stealing the main thread from the drag frame.
 */
function isPersistedPlayerEqual(
  a: { state: PersistedPlayerState },
  b: { state: PersistedPlayerState },
): boolean {
  return (
    a.state.queue === b.state.queue &&
    a.state.currentId === b.state.currentId &&
    a.state.volume === b.state.volume &&
    a.state.muted === b.state.muted &&
    a.state.repeat === b.state.repeat
  )
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      queue: [],
      currentId: null,
      isPlaying: false,
      isBuffering: false,
      volume: 80,
      muted: false,
      repeat: 'off',
      currentTime: 0,
      duration: 0,
      pendingPlay: false,
      expanded: true,

      setQueue: (queue) =>
        set({
          queue,
          currentId: queue[0]?.id ?? null,
          currentTime: 0,
          duration: 0,
          pendingPlay: false,
        }),

      clearQueue: () =>
        set({
          queue: [],
          currentId: null,
          isPlaying: false,
          currentTime: 0,
          duration: 0,
          pendingPlay: false,
        }),

      setCurrentId: (currentId, autoplay = false) =>
        set({ currentId, currentTime: 0, duration: 0, pendingPlay: autoplay }),

      next: () => {
        const { queue, currentId, repeat, isPlaying } = get()
        if (queue.length === 0) return
        const index = queue.findIndex((track) => track.id === currentId)
        const nextIndex = index + 1

        if (nextIndex < queue.length) {
          set({
            currentId: queue[nextIndex].id,
            currentTime: 0,
            duration: 0,
            pendingPlay: isPlaying,
          })
          return
        }
        if (repeat === 'all') {
          set({
            currentId: queue[0].id,
            currentTime: 0,
            duration: 0,
            pendingPlay: isPlaying,
          })
        }
      },

      previous: () => {
        const { queue, currentId, repeat, isPlaying } = get()
        if (queue.length === 0) return
        const index = queue.findIndex((track) => track.id === currentId)
        const prevIndex = index - 1

        if (prevIndex >= 0) {
          set({
            currentId: queue[prevIndex].id,
            currentTime: 0,
            duration: 0,
            pendingPlay: isPlaying,
          })
          return
        }
        if (repeat === 'all') {
          set({
            currentId: queue[queue.length - 1].id,
            currentTime: 0,
            duration: 0,
            pendingPlay: isPlaying,
          })
        }
      },

      onTrackEnded: () => {
        const { queue, currentId, repeat } = get()
        if (repeat === 'off') {
          const index = queue.findIndex((track) => track.id === currentId)
          if (index >= queue.length - 1) {
            // End of the queue: stay put, paused.
            set({ isPlaying: false, currentTime: 0, pendingPlay: false })
          }
        }
        get().next()
      },

      setPlaying: (isPlaying) => set({ isPlaying, pendingPlay: false }),
      setBuffering: (isBuffering) => set({ isBuffering }),
      setPendingPlay: (pendingPlay) => set({ pendingPlay }),
      // Dragging the slider to zero mutes it, and dragging it up unmutes: the slider is
      // always in sync with what you hear.
      setVolume: (volume) =>
        set(() => {
          const clamped = Math.min(100, Math.max(0, Math.round(volume)))
          return { volume: clamped, muted: clamped === 0 }
        }),
      toggleMute: () =>
        set((state) =>
          state.muted
            ? // Unmuting at volume 0 would be inaudible, so restore a usable level.
              { muted: false, volume: state.volume || 50 }
            : { muted: true },
        ),
      cycleRepeat: () =>
        set({
          repeat: REPEAT_ORDER[(REPEAT_ORDER.indexOf(get().repeat) + 1) % REPEAT_ORDER.length],
        }),
      setExpanded: (expanded) => set({ expanded }),
      setTime: (currentTime, duration) => set({ currentTime, duration }),

      removeAt: (index) => {
        const { queue, currentId, isPlaying } = get()
        const removed = queue[index]
        const rest = queue.filter((_, position) => position !== index)

        if (!removed) return

        // Removing the playing track hands over to its neighbour and keeps playing.
        if (currentId === removed.id) {
          set({
            queue: rest,
            currentId: rest[Math.min(index, rest.length - 1)]?.id ?? null,
            currentTime: 0,
            duration: 0,
            pendingPlay: isPlaying,
          })
          return
        }

        set({ queue: rest })
      },

      moveTrack: (from, to) => set({ queue: arrayMove(get().queue, from, to) }),

      // The menu works with indices, not ids: with dedupe off the same track can appear
      // several times and every action must hit the row the user actually clicked.
      playNext: (index) => {
        const { queue, currentId } = get()
        const track = queue[index]
        if (!track) return

        const rest = queue.filter((_, position) => position !== index)
        const currentIndex = rest.findIndex((item) => item.id === currentId)
        const insertAt = currentIndex < 0 ? 0 : currentIndex + 1

        set({ queue: [...rest.slice(0, insertAt), track, ...rest.slice(insertAt)] })
      },

      moveToEnd: (index) => {
        const { queue } = get()
        const track = queue[index]
        if (!track) return
        set({ queue: [...queue.filter((_, position) => position !== index), track] })
      },

      markUnavailable: (id) => {
        const { queue } = get()
        set({
          queue: queue.map((track) => (track.id === id ? { ...track, available: false } : track)),
        })
        // This store is not a React component, so the locale is read at call time.
        const { locale } = useSettingsStore.getState()
        toast.warning(translate(locale, 'toast.videoUnavailable'), {
          description: translate(locale, 'toast.videoUnavailableDescription'),
        })
      },
    }),
    {
      name: 'yt-random-playlist:player',
      // Writing the whole queue on every `set()` blocked the main thread on huge queues, and
      // the playback clock alone ticks several times a second.
      storage: createDebouncedStorage(getClientStorage, isPersistedPlayerEqual),
      // Skip auto-hydration on the server (no localStorage there): Providers rehydrates
      // on mount so the first client render matches the prerendered HTML.
      skipHydration: true,
      partialize: (state) => ({
        queue: state.queue,
        currentId: state.currentId,
        volume: state.volume,
        muted: state.muted,
        repeat: state.repeat,
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<PlayerState>
        return {
          ...current,
          ...saved,
          // Never auto-resume playback after a reload: browsers block it and it is surprising.
          isPlaying: false,
          isBuffering: false,
          currentTime: 0,
          duration: 0,
          pendingPlay: false,
          expanded: true,
          repeat: saved.repeat ?? 'off',
        }
      },
    },
  ),
)
