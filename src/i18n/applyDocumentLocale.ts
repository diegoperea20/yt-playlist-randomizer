'use client'
import { translate } from './translate'
import type { Locale } from './types'

/** Keep `<html lang>` (screen readers) and the tab title in sync with the chosen locale. */
export function applyDocumentLocale(locale: Locale): void {
  document.documentElement.lang = locale
  document.title = translate(locale, 'document.title')
}
