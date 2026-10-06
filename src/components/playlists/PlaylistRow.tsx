'use client'
import { useState } from 'react'
import {
  AlertCircle,
  Check,
  ExternalLink,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react'
import type { PlaylistMeta } from '../../types'
import { loadStatusKey } from '../../i18n/keys'
import { useT } from '../../i18n/useT'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Tooltip } from '../ui/tooltip'

const STATUS_TONE = {
  loading: 'warning',
  ready: 'success',
  error: 'danger',
  idle: 'neutral',
} as const

export function PlaylistRow({
  playlist,
  status,
  error,
  trackCount,
  onToggle,
  onRename,
  onRefresh,
  onRemove,
}: {
  playlist: PlaylistMeta
  status: 'idle' | 'loading' | 'ready' | 'error'
  error?: string
  trackCount: number
  onToggle: (active: boolean) => void
  onRename: (label: string) => void
  onRefresh: () => void
  onRemove: () => void
}) {
  const { t } = useT()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(playlist.label)

  const commitName = () => {
    setIsEditing(false)
    if (draft.trim() && draft.trim() !== playlist.label) onRename(draft)
    else setDraft(playlist.label)
  }

  return (
    <li className="bg-surface-raised border-line-subtle rounded-xl border p-3 transition-colors">
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          checked={playlist.active}
          onChange={(event) => onToggle(event.target.checked)}
          className="accent-brand mt-0.5 size-5 shrink-0 cursor-pointer"
          aria-label={t('playlists.includeInMix', { label: playlist.label })}
        />

        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onBlur={commitName}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') commitName()
                  if (event.key === 'Escape') {
                    setDraft(playlist.label)
                    setIsEditing(false)
                  }
                }}
                aria-label={t('playlists.nameLabel')}
                className="border-line-subtle bg-surface-base focus:border-brand h-8 w-full rounded-md border px-2 text-sm focus:outline-none"
              />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={commitName}
                aria-label={t('common.save')}
              >
                <Check />
              </Button>
            </div>
          ) : (
            <div className="group/name flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="truncate text-left text-sm font-medium text-content-primary hover:underline"
                title={t('playlists.renameTitle')}
              >
                {playlist.label}
              </button>
              <Pencil className="text-content-muted size-3 opacity-0 transition-opacity group-hover/name:opacity-100" />
            </div>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone={STATUS_TONE[status]}>
              {status === 'loading' ? <Loader2 className="size-3 animate-spin" /> : null}
              {status === 'ready'
                ? t('playlists.trackCount', { count: trackCount })
                : t(loadStatusKey(status))}
            </Badge>
            {status === 'error' && error ? (
              <span className="min-w-0 flex-1 basis-full text-[11px] leading-snug break-words text-red-300">
                {error}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <Tooltip label={t('playlists.refreshFromYouTube')}>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onRefresh}
              aria-label={t('playlists.refresh')}
            >
              <RefreshCw className={status === 'loading' ? 'animate-spin' : undefined} />
            </Button>
          </Tooltip>
          <Tooltip label={t('playlists.openInYouTube')}>
            <Button variant="ghost" size="icon-sm" asChild>
              <a
                href={playlist.url}
                target="_blank"
                rel="noreferrer"
                aria-label={t('playlists.openInYouTube')}
              >
                <ExternalLink />
              </a>
            </Button>
          </Tooltip>
          <Tooltip label={t('playlists.removeFromList')}>
            <Button
              variant="danger"
              size="icon-sm"
              onClick={onRemove}
              aria-label={t('playlists.remove')}
            >
              <Trash2 />
            </Button>
          </Tooltip>
        </div>
      </div>

      {status === 'error' ? (
        <Button variant="outline" size="sm" className="mt-2 w-full" onClick={onRefresh}>
          <AlertCircle />
          {t('common.retry')}
        </Button>
      ) : null}

      {isEditing ? (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => {
            setDraft(playlist.label)
            setIsEditing(false)
          }}
        >
          <X />
          {t('common.cancel')}
        </Button>
      ) : null}
    </li>
  )
}
