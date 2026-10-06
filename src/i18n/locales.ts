import type { Locale } from './types'

export const LOCALES = ['es', 'en'] as const

export const DEFAULT_LOCALE: Locale = 'en'

/** Short code shown on the language toggle. */
export const LOCALE_CODES: Record<Locale, string> = {
  es: 'ES',
  en: 'EN',
}

/** Endonyms: each language is always named in itself. */
export const LOCALE_NAMES: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}
