'use client'
import { ListVideo, RefreshCcw } from 'lucide-react'
import { Button } from '../ui/button'
import { EmptyState, SectionTitle } from '../ui/primitives'
import { useT } from '../../i18n/useT'
import { usePlaylistsStore } from '../../store/playlistsStore'
import { PlaylistRow } from './PlaylistRow'

export function PlaylistList({
  onRefresh,
  onRefreshAll,
  onRemove,
}: {
  onRefresh: (playlistId: string) => void
  onRefreshAll: () => void
  onRemove: (playlistId: string) => void
}) {
  const { t } = useT()
  const playlists = usePlaylistsStore((state) => state.playlists)
  const status = usePlaylistsStore((state) => state.status)
  const errors = usePlaylistsStore((state) => state.errors)
  const tracks = usePlaylistsStore((state) => state.tracks)
  const renamePlaylist = usePlaylistsStore((state) => state.renamePlaylist)
  const setActive = usePlaylistsStore((state) => state.setActive)

  if (playlists.length === 0) {
    return (
      <EmptyState
        icon={<ListVideo />}
        title={t('playlists.emptyTitle')}
        description={t('playlists.emptyDescription')}
      />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle>{t('playlists.listTitle', { count: playlists.length })}</SectionTitle>
        <Button variant="ghost" size="sm" onClick={onRefreshAll}>
          <RefreshCcw />
          {t('playlists.refreshAll')}
        </Button>
      </div>

      <ul className="flex flex-col gap-2">
        {playlists.map((playlist) => (
          <PlaylistRow
            key={playlist.id}
            playlist={playlist}
            status={status[playlist.id] ?? 'idle'}
            error={errors[playlist.id]}
            trackCount={tracks[playlist.id]?.length ?? 0}
            onToggle={(active) => setActive(playlist.id, active)}
            onRename={(label) => renamePlaylist(playlist.id, label)}
            onRefresh={() => onRefresh(playlist.id)}
            onRemove={() => onRemove(playlist.id)}
          />
        ))}
      </ul>
    </div>
  )
}
