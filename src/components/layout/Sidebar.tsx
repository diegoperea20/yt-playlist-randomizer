'use client'
import { Plus } from 'lucide-react'
import { AddPlaylistForm } from '../playlists/AddPlaylistForm'
import { ModeSelector } from '../playlists/ModeSelector'
import { PlaylistList } from '../playlists/PlaylistList'
import { SectionTitle } from '../ui/primitives'
import { useT } from '../../i18n/useT'

/** Left panel: playlist manager plus the randomization mode and its options. */
export function Sidebar({
  onAdd,
  isLoading,
  onRefresh,
  onRefreshAll,
  onRemove,
}: {
  onAdd: (url: string) => boolean
  isLoading: boolean
  onRefresh: (playlistId: string) => void
  onRefreshAll: () => void
  onRemove: (playlistId: string) => void
}) {
  const { t } = useT()

  // `content` containment keeps the scrolled-out content from leaking into the
  // document's scrollable overflow (and the black gap below the app with it).
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] [contain:content] sm:p-4">
      <section className="flex flex-col gap-2.5">
        <SectionTitle icon={<Plus className="size-3.5" />}>{t('sidebar.addPlaylist')}</SectionTitle>
        <AddPlaylistForm onAdd={onAdd} isLoading={isLoading} />
      </section>

      <PlaylistList onRefresh={onRefresh} onRefreshAll={onRefreshAll} onRemove={onRemove} />

      <div className="border-line-subtle border-t pt-4">
        <ModeSelector />
      </div>
    </div>
  )
}
