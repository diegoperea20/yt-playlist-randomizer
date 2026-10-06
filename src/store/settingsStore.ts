'use client'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { DEFAULT_LOCALE, isLocale } from '../i18n/locales'
import { getClientStorage } from '../lib/noopStorage'
import type { Locale } from '../i18n/types'

type SettingsState = {
  locale: Locale
  setLocale: (locale: Locale) => void
  /** Flip to the only other supported language. */
  toggleLocale: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      locale: DEFAULT_LOCALE,

      setLocale: (locale) => set({ locale }),

      toggleLocale: () => set({ locale: get().locale === 'es' ? 'en' : 'es' }),
    }),
    {
      name: 'yt-random-playlist:settings',
      storage: createJSONStorage(() => getClientStorage()),
      // No localStorage during SSR: Providers rehydrates on mount.
      skipHydration: true,
      partialize: (state) => ({ locale: state.locale }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<SettingsState>
        // A locale written by another build must still resolve to a language we ship.
        return { ...current, locale: isLocale(saved.locale) ? saved.locale : DEFAULT_LOCALE }
      },
    },
  ),
)
