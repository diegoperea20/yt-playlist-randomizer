'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { TooltipProvider } from '../components/ui/tooltip'
import { PlayerBridgeProvider } from '../hooks/usePlayerBridge'
import { applyDocumentLocale } from '../i18n/applyDocumentLocale'
import { usePlayerStore } from '../store/playerStore'
import { usePlaylistsStore } from '../store/playlistsStore'
import { useSettingsStore } from '../store/settingsStore'

export function Providers({ children }: { children: ReactNode }) {
  // Created lazily so each mount gets its own cache.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Playlists are cached in IndexedDB and only refreshed on demand, so the
            // network layer never refetches behind the user's back.
            staleTime: 1000 * 60 * 60,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )
  const locale = useSettingsStore((state) => state.locale)

  // Persisted stores skip auto-hydration (no localStorage during SSR).
  useEffect(() => {
    void useSettingsStore.persist.rehydrate()
    void usePlaylistsStore.persist.rehydrate()
    void usePlayerStore.persist.rehydrate()
  }, [])

  useEffect(() => {
    applyDocumentLocale(locale)
  }, [locale])

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={250}>
        <PlayerBridgeProvider>
          {children}
          <Toaster theme="dark" position="bottom-right" richColors closeButton />
        </PlayerBridgeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}
