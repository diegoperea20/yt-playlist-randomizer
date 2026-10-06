'use client'
import { memo, type CSSProperties } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, ListEnd, ListStart, Play, Trash2, TriangleAlert } from 'lucide-react'
import { formatTime } from '../../lib/time'
import { useT } from '../../i18n/useT'
import type { Track } from '../../types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Button } from '../ui/button'

export type RowActions = {
  onPlay: (id: string) => void
  onPlayNext: (index: number) => void
  onMoveToEnd: (index: number) => void
  onRemoveAt: (index: number) => void
}

type SortableTrackRowProps = {
  track: Track
  index: number
  sortableId: string
  isCurrent: boolean
  actions: RowActions
  style?: CSSProperties
}

/** dnd-kit memoizes both of these, so they keep their identity while a drag is running. */
type SortableAttributes = ReturnType<typeof useSortable>['attributes']
type SortableListeners = ReturnType<typeof useSortable>['listeners']

type TrackRowBodyProps = {
  track: Track
  index: number
  isCurrent: boolean
  actions: RowActions
  attributes: SortableAttributes
  listeners: SortableListeners
}

/**
 * One queue row. Kept at a fixed height so the virtualizer never needs to measure, which
 * is what makes dragging coexist with windowing.
 */
export const SortableTrackRow = memo(function SortableTrackRow({
  track,
  index,
  sortableId,
  isCurrent,
  actions,
  style,
}: SortableTrackRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sortableId,
  })

  return (
    // The row is positioned with `top` (not `translateY`) on purpose: dnd-kit measures
    // droppables with a transform-agnostic rect, so transformed rows would all collapse
    // to the same box and every drop would land on the first item.
    // The outer element positions the row inside the virtualized list; the inner one
    // carries the drag transform, so windowing and dragging never fight over it.
    // The row being dragged itself stays pinned as a placeholder: the DragOverlay is what
    // follows the pointer, so applying the strategy transform here as well would show the
    // song jumping in row-sized steps instead of glued to the cursor.
    <div ref={setNodeRef} style={style} className="absolute left-0 w-full">
      <div
        style={
          isDragging
            ? undefined
            : {
                transform: CSS.Translate.toString(transform),
                transition,
              }
        }
        className={isDragging ? 'relative z-10 opacity-40' : 'relative'}
      >
        <TrackRowBody
          track={track}
          index={index}
          isCurrent={isCurrent}
          actions={actions}
          attributes={attributes}
          listeners={listeners}
        />
      </div>
    </div>
  )
})

/**
 * Everything in a row that does not depend on the drag state.
 *
 * This is memoized because `useSortable` consumes `SortableContext`, whose value changes on
 * every collision or scroll update and re-renders every mounted row. Splitting the row means
 * the rows whose position did not change skip re-rendering, which keeps the dropdown menu,
 * the icons and the duration formatting out of the drag loop. Every prop here is stable for
 * the duration of a drag: the track, its index, the actions object and the dnd-kit
 * `attributes`/`listeners`, which are both memoized on stable inputs.
 */
const TrackRowBody = memo(function TrackRowBody({
  track,
  index,
  isCurrent,
  actions,
  attributes,
  listeners,
}: TrackRowBodyProps) {
  const { t } = useT()

  return (
    <div
      className={`group mx-1 flex items-center gap-2 rounded-lg px-2 transition-colors ${
        isCurrent
          ? 'bg-brand-soft text-content-primary'
          : 'text-content-secondary hover:bg-surface-overlay'
      }`}
    >
      <button
        type="button"
        className="text-content-muted hover:text-content-primary cursor-grab touch-none rounded p-2 active:cursor-grabbing"
        aria-label={t('queue.reorder', { title: track.title })}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <div
        // The same listeners on the row body let the mouse drag from anywhere, while
        // the grip above keeps the accessible drag handle for keyboards.
        className="flex min-w-0 flex-1 cursor-grab touch-none items-center select-none active:cursor-grabbing"
        {...listeners}
      >
        <button
          type="button"
          onClick={() => actions.onPlay(track.id)}
          className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left"
          aria-label={t('queue.playTrack', { title: track.title })}
          aria-current={isCurrent ? 'true' : undefined}
        >
          {isCurrent ? (
            <span className="bg-surface-overlay flex size-9 shrink-0 items-center justify-center overflow-hidden rounded">
              <Play className="text-brand size-3.5 fill-current" />
            </span>
          ) : (
            <img
              src={track.thumbnail}
              alt=""
              loading="lazy"
              decoding="async"
              className="size-9 shrink-0 rounded object-cover"
            />
          )}

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">
              {track.title}
              {!track.available ? (
                <TriangleAlert
                  className="ml-1.5 inline size-3 text-amber-400"
                  aria-label={t('queue.unavailable')}
                />
              ) : null}
            </span>
            <span className="text-content-muted block truncate text-xs">{track.channel}</span>
          </span>

          <span className="text-content-muted shrink-0 font-mono text-[11px] tabular-nums">
            {formatTime(track.durationSec)}
          </span>
        </button>
      </div>

      <RowMenu index={index} actions={actions} trackId={track.id} />
    </div>
  )
})

const RowMenu = memo(function RowMenu({
  index,
  actions,
  trackId,
}: {
  index: number
  trackId: string
  actions: RowActions
}) {
  const { t } = useT()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          // No hover on touch screens: keep the menu reachable there.
          className="lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
          aria-label={t('queue.rowMenu', { index: index + 1 })}
          // Opening the menu must not start a drag.
          onPointerDown={(event) => event.stopPropagation()}
        >
          <span aria-hidden="true">···</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => actions.onPlay(trackId)}>
          <Play />
          {t('queue.playNow')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => actions.onPlayNext(index)}>
          <ListStart />
          {t('queue.playNext')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => actions.onMoveToEnd(index)}>
          <ListEnd />
          {t('queue.moveToEnd')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem danger onSelect={() => actions.onRemoveAt(index)}>
          <Trash2 />
          {t('queue.remove')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

/** Static preview shown under the cursor while dragging. */
export function TrackRowPreview({ track }: { track: Track }) {
  return (
    <div className="bg-surface-overlay border-line-strong flex items-center gap-2 rounded-lg border px-2 py-2 shadow-xl">
      <GripVertical className="text-content-muted size-3.5" />
      <img src={track.thumbnail} alt="" className="size-9 rounded object-cover" />
      <span className="max-w-56 truncate text-sm font-medium">{track.title}</span>
    </div>
  )
}
