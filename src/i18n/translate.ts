import { en, type Dictionary } from './en'
import { es } from './es'
import type { Locale, Plural, TranslateValues } from './types'

const DICTIONARIES: Record<Locale, Dictionary> = { es, en }

/** Every leaf of the reference dictionary, addressed as a dotted path. */
type KeyPath<T> = {
  [K in keyof T & string]: T[K] extends string | Plural ? K : `${K}.${KeyPath<T[K]>}`
}[keyof T & string]

export type TranslationKey = KeyPath<Dictionary>

function isPlural(value: unknown): value is Plural {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<Plural>
  return typeof candidate.one === 'string' && typeof candidate.other === 'string'
}

function resolve(dictionary: Dictionary, key: string): string | Plural | undefined {
  let node: unknown = dictionary

  for (const segment of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined
    node = (node as Record<string, unknown>)[segment]
  }

  return typeof node === 'string' || isPlural(node) ? node : undefined
}

function pluralForm(locale: Locale, count: number): keyof Plural {
  return new Intl.PluralRules(locale).select(count) === 'one' ? 'one' : 'other'
}

function interpolate(template: string, values?: TranslateValues): string {
  if (!values) return template
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
    const value = values[name]
    return value === undefined ? placeholder : String(value)
  })
}

/** An unknown key resolves to itself, so a gap shows up in the UI instead of rendering blank. */
export function translate(locale: Locale, key: string, values?: TranslateValues): string {
  const entry = resolve(DICTIONARIES[locale], key)
  if (entry === undefined) return key

  const template =
    typeof entry === 'string' ? entry : entry[pluralForm(locale, Number(values?.count ?? 0))]
  return interpolate(template, values)
}
