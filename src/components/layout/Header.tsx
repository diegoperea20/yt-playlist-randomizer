'use client'
import { Languages, ListMusic, Shuffle, SlidersHorizontal } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tooltip } from '../ui/tooltip'
import { LOCALE_CODES, LOCALE_NAMES } from '../../i18n/locales'
import { modeKey } from '../../i18n/keys'
import { useT } from '../../i18n/useT'
import { usePlaylistsStore } from '../../store/playlistsStore'
import { usePlayerStore } from '../../store/playerStore'
import { useSettingsStore } from '../../store/settingsStore'

export function Header({
  onShuffle,
  trackCount,
  isReady,
  onOpenPlaylists,
  onOpenQueue,
}: {
  onShuffle: () => void
  trackCount: number
  isReady: boolean
  onOpenPlaylists: () => void
  onOpenQueue: () => void
}) {
  const { t, locale } = useT()
  const toggleLocale = useSettingsStore((state) => state.toggleLocale)
  const mode = usePlaylistsStore((state) => state.mode)
  const queueLength = usePlayerStore((state) => state.queue.length)

  const shuffleLabel = t('header.shuffle')
  // The badge advertises where the click leads, not where we already are.
  const nextLocale = locale === 'es' ? 'en' : 'es'

  return (
    <header className="bg-surface-raised border-line-subtle flex items-center gap-2 border-b px-3 py-2 sm:gap-3 sm:px-4">
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 lg:hidden"
        onClick={onOpenPlaylists}
        aria-label={t('header.managePlaylists')}
      >
        <SlidersHorizontal />
      </Button>

      <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
        <span className="bg-brand hidden size-8 shrink-0 items-center justify-center rounded-lg sm:flex">
          <ListMusic className="size-4.5 text-white" />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold tracking-tight">YT Randomizer</h1>
          <p className="text-content-muted truncate text-xs">
            {t(modeKey(mode, 'label'))}
            {queueLength > 0 ? ` · ${t('header.inQueue', { count: queueLength })}` : ''}
          </p>
        </div>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        {trackCount > 0 ? (
          <Badge tone="neutral" className="hidden md:inline-flex">
            {t('header.trackCount', { count: trackCount })}
          </Badge>
        ) : null}

        <Tooltip label={t('header.viewQueue')}>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onOpenQueue}
            aria-label={t('header.viewQueue')}
          >
            <ListMusic />
          </Button>
        </Tooltip>

        <Tooltip label={t('header.switchLanguage', { language: LOCALE_NAMES[nextLocale] })}>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLocale}
            aria-label={t('header.languageToggle')}
            className="relative"
          >
            <Languages />
            <span
              aria-hidden="true"
              className="text-content-secondary absolute right-0.5 bottom-0 text-[9px] leading-none font-semibold"
            >
              {LOCALE_CODES[nextLocale]}
            </span>
          </Button>
        </Tooltip>

        <Button
          variant="brand"
          onClick={onShuffle}
          disabled={!isReady}
          title={t('header.shuffleTitle')}
        >
          <Shuffle />
          <span className="hidden sm:inline">{shuffleLabel}</span>
        </Button>
      </div>
    </header>
  )
}
