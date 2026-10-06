'use client'
import { useCallback } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { translate, type TranslationKey } from './translate'
import type { Locale, TranslateValues } from './types'

/**
 * Bind `translate` to the locale currently selected in the store. Every consumer
 * re-renders when the language changes, because `locale` is part of the subscription.
 */
export function useT(): {
  t: (key: TranslationKey, values?: TranslateValues) => string
  locale: Locale
} {
  const locale = useSettingsStore((state) => state.locale)
  const t = useCallback(
    (key: TranslationKey, values?: TranslateValues) => translate(locale, key, values),
    [locale],
  )

  return { t, locale }
}
