'use client'
import { useCallback, useSyncExternalStore } from 'react'

/** Subscribe to a CSS media query without touching refs during render. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query])

  // The server snapshot is irrelevant here: this app is client-only.
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

/** Tailwind's `lg` breakpoint, used to decide between panels and bottom sheets. */
export const DESKTOP_QUERY = '(min-width: 64rem)'
