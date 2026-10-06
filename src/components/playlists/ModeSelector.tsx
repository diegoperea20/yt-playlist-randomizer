'use client'
import { Info } from 'lucide-react'
import { SHUFFLE_MODES } from '../../types'
import { modeKey } from '../../i18n/keys'
import { useT } from '../../i18n/useT'
import { SectionTitle, Switch } from '../ui/primitives'
import { usePlaylistsStore } from '../../store/playlistsStore'

export function ModeSelector() {
  const { t } = useT()
  const mode = usePlaylistsStore((state) => state.mode)
  const dedupe = usePlaylistsStore((state) => state.dedupe)
  const reshuffleRounds = usePlaylistsStore((state) => state.reshuffleRounds)
  const setMode = usePlaylistsStore((state) => state.setMode)
  const setDedupe = usePlaylistsStore((state) => state.setDedupe)
  const setReshuffleRounds = usePlaylistsStore((state) => state.setReshuffleRounds)

  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>{t('mode.sectionTitle')}</SectionTitle>

      <div role="radiogroup" aria-label={t('mode.groupLabel')} className="flex flex-col gap-1.5">
        {SHUFFLE_MODES.map((value) => (
          <ModeOption
            key={value}
            label={t(modeKey(value, 'label'))}
            description={t(modeKey(value, 'description'))}
            checked={mode === value}
            onSelect={() => setMode(value)}
          />
        ))}
      </div>

      <div className="border-line-subtle flex flex-col gap-3 border-t pt-3">
        <Switch
          label={t('mode.dedupe')}
          description={t('mode.dedupeDescription')}
          checked={dedupe}
          onCheckedChange={setDedupe}
        />
        <Switch
          label={t('mode.reshuffleRounds')}
          description={t('mode.reshuffleRoundsDescription')}
          checked={reshuffleRounds}
          onCheckedChange={setReshuffleRounds}
        />
      </div>

      <p className="text-content-muted flex items-start gap-1.5 text-[11px] leading-relaxed">
        <Info className="mt-px size-3 shrink-0" />
        {t('mode.footnote', { shuffle: t('header.shuffle') })}
      </p>
    </div>
  )
}

function ModeOption({
  label,
  description,
  checked,
  onSelect,
}: {
  label: string
  description: string
  checked: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={
        checked
          ? 'border-brand/50 bg-brand-soft rounded-xl border p-3 text-left shadow-sm transition-all duration-150'
          : 'border-line-subtle hover:border-line-strong hover:bg-surface-overlay rounded-xl border p-3 text-left transition-all duration-150 active:scale-[0.99]'
      }
    >
      <span className="flex items-center gap-2.5">
        <span
          className={
            checked
              ? 'bg-brand border-brand flex size-4 items-center justify-center rounded-full border-2'
              : 'border-line-strong size-4 rounded-full border-2'
          }
        >
          {checked ? <span className="size-1.5 rounded-full bg-white" /> : null}
        </span>
        <span className="text-content-primary text-sm font-medium">{label}</span>
      </span>
      <span className="text-content-muted mt-1 block pl-6.5 text-[11px] leading-relaxed">
        {description}
      </span>
    </button>
  )
}
