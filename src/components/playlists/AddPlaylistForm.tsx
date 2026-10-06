'use client'
import { useId, useState, type FormEvent } from 'react'
import { ListPlus, Loader2 } from 'lucide-react'
import { useT } from '../../i18n/useT'
import { Button } from '../ui/button'

const EXAMPLE_URL =
  'https://music.youtube.com/watch?v=-L4Visli9sA&list=PLDz_yiNwIkRN0iYpoe7iJoqfCLOdUK6is'

/** Form to paste YouTube / YouTube Music playlist URLs. */
export function AddPlaylistForm({
  onAdd,
  isLoading,
}: {
  onAdd: (url: string) => boolean
  isLoading: boolean
}) {
  const { t } = useT()
  const inputId = useId()
  const [value, setValue] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (onAdd(value)) setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor={inputId} className="sr-only">
        {t('playlists.urlLabel')}
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder={t('playlists.urlPlaceholder')}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="border-line-subtle bg-surface-base placeholder:text-content-muted focus:border-brand focus:ring-brand/25 h-10 min-w-0 flex-1 rounded-lg border px-3 text-sm transition-shadow focus:ring-2 focus:outline-none"
        />
        <Button type="submit" variant="brand" disabled={!value.trim() || isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : <ListPlus />}
          <span className="hidden sm:inline">{t('playlists.add')}</span>
        </Button>
      </div>
      <p className="text-content-muted text-[11px] leading-relaxed">
        {t('playlists.visibilityHint')}{' '}
        <button
          type="button"
          className="text-content-secondary hover:text-content-primary underline underline-offset-2"
          onClick={() => setValue(EXAMPLE_URL)}
        >
          {t('playlists.useExampleUrl')}
        </button>
      </p>
    </form>
  )
}
