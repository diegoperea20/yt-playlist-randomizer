'use client'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { PlaylistMeta, ShuffleMode, Track } from '../types'
import { getClientStorage } from '../lib/noopStorage'
import { clearCachedTracks, readCachedTracks } from '../lib/youtube/cache'

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

type PlaylistsState = {
  /** Light metadata only: the heavy `tracks` are cached in IndexedDB, see `tracks`. */
  playlists: PlaylistMeta[]
  /** Runtime track cache, rehydrated from IndexedDB on start. */
  tracks: Record<string, Track[]>
  status: Record<string, LoadStatus>
  errors: Record<string, string>

  mode: ShuffleMode
  dedupe: boolean
  reshuffleRounds: boolean

  addPlaylist: (playlist: { id: string; url: string; label?: string }) => boolean
  removePlaylist: (id: string) => void
  renamePlaylist: (id: string, label: string) => void
  setActive: (id: string, active: boolean) => void
  setAllActive: (active: boolean) => void

  setTracks: (id: string, tracks: Track[]) => void
  setStatus: (id: string, status: LoadStatus) => void
  setError: (id: string, error: string) => void

  setMode: (mode: ShuffleMode) => void
  setDedupe: (dedupe: boolean) => void
  setReshuffleRounds: (reshuffleRounds: boolean) => void

  /** Repopulate the runtime track cache from IndexedDB after a page reload. */
  hydrateTracks: () => Promise<void>
}

/** Copy a record without one key, so React sees a new stable reference. */
function omit<T>(record: Record<string, T>, key: string): Record<string, T> {
  const copy = { ...record }
  delete copy[key]
  return copy
}

const nextLabel = (index: number) => `Playlist ${String.fromCharCode(64 + index)}`

export const usePlaylistsStore = create<PlaylistsState>()(
  persist(
    (set, get) => ({
      playlists: [],
      tracks: {},
      status: {},
      errors: {},
      mode: 'consecutive-random',
      dedupe: true,
      reshuffleRounds: false,

      /** Returns false when the playlist was already in the list. */
      addPlaylist: ({ id, url, label }) => {
        if (get().playlists.some((item) => item.id === id)) {
          // Re-adding a known playlist just asks for a refresh.
          set({ status: { ...get().status, [id]: 'idle' }, errors: { ...get().errors, [id]: '' } })
          return false
        }

        const meta: PlaylistMeta = {
          id,
          url,
          label: label ?? nextLabel(get().playlists.length + 1),
          loadedAt: 0,
          trackCount: 0,
          active: true,
        }

        set({ playlists: [...get().playlists, meta], status: { ...get().status, [id]: 'idle' } })
        return true
      },

      removePlaylist: (id) => {
        void clearCachedTracks(id)
        set({
          playlists: get().playlists.filter((item) => item.id !== id),
          status: omit(get().status, id),
          errors: omit(get().errors, id),
          tracks: omit(get().tracks, id),
        })
      },

      renamePlaylist: (id, label) =>
        set({
          playlists: get().playlists.map((item) =>
            item.id === id ? { ...item, label: label.trim() || item.label } : item,
          ),
        }),

      setActive: (id, active) =>
        set({
          playlists: get().playlists.map((item) => (item.id === id ? { ...item, active } : item)),
        }),

      setAllActive: (active) =>
        set({ playlists: get().playlists.map((item) => ({ ...item, active })) }),

      setTracks: (id, tracks) =>
        set((state) => {
          if (state.tracks[id] === tracks) return state
          return {
            tracks: { ...state.tracks, [id]: tracks },
            playlists: state.playlists.map((item) =>
              item.id === id ? { ...item, trackCount: tracks.length, loadedAt: Date.now() } : item,
            ),
          }
        }),

      // The setters below bail out when nothing changes: they are called from effects that
      // run on every render, and a new object every time would loop forever.
      setStatus: (id, status) =>
        set((state) =>
          state.status[id] === status ? state : { status: { ...state.status, [id]: status } },
        ),

      setError: (id, error) =>
        set((state) =>
          state.errors[id] === error ? state : { errors: { ...state.errors, [id]: error } },
        ),

      setMode: (mode) => set({ mode }),
      setDedupe: (dedupe) => set({ dedupe }),
      setReshuffleRounds: (reshuffleRounds) => set({ reshuffleRounds }),

      hydrateTracks: async () => {
        const metas = get().playlists
        const cached = await Promise.all(
          metas.map(async (meta) => [meta.id, await readCachedTracks(meta.id)] as const),
        )

        set((state) => {
          const tracks = { ...state.tracks }
          const status = { ...state.status }
          for (const [id, entry] of cached) {
            if (entry && entry.length > 0) {
              tracks[id] = entry
              status[id] = 'ready'
            }
          }
          return { tracks, status }
        })
      },
    }),
    {
      name: 'yt-random-playlist:playlists',
      storage: createJSONStorage(() => getClientStorage()),
      // No localStorage during SSR: Providers rehydrates on mount.
      skipHydration: true,
      // Tracks are cached in IndexedDB, so only light metadata and options are persisted.
      partialize: (state) => ({
        playlists: state.playlists,
        mode: state.mode,
        dedupe: state.dedupe,
        reshuffleRounds: state.reshuffleRounds,
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<PlaylistsState>
        // Playlists persisted before `active` existed must still default to enabled.
        const playlists = (saved.playlists ?? []).map((item) =>
          // Playlists persisted before `active` existed must still default to enabled.
          item.active === undefined ? { ...item, active: true } : item,
        )
        return { ...current, ...saved, playlists }
      },
    },
  ),
)
