/** The languages the UI ships with. */
export type Locale = 'es' | 'en'

/** Values available to `{placeholder}` interpolation. */
export type TranslateValues = Record<string, string | number>

/** A string with a singular and a plural form, picked with `Intl.PluralRules`. */
export type Plural = {
  one: string
  other: string
}
