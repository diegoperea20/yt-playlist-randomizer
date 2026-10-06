'use client'
import { useCallback, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual'
import { ListVideo, Trash2 } from 'lucide-react'
import { useT } from '../../i18n/useT'
import { usePlayerStore } from '../../store/playerStore'
import { Button } from '../ui/button'
import { EmptyState } from '../ui/primitives'
import { SortableTrackRow, TrackRowPreview, type RowActions } from './SortableTrackRow'
import { ROW_HEIGHT, dragWindowWithActive } from './dragWindow'

/**
 * Row styles depend only on `start`, so they are cached to keep their identity stable across
 * renders: `React.memo` compares props shallowly and a fresh object literal every render
 * would defeat it. The cache is bounded because every queue position is a distinct key and
 * huge queues would otherwise leak entries forever.
 */
const ROW_STYLE_CACHE_LIMIT = 2000
const rowStyleCache = new Map<number, CSSProperties>()
function rowStyle(start: number): CSSProperties {
  const cached = rowStyleCache.get(start)
  if (cached) return cached
  const style: CSSProperties = { height: `${ROW_HEIGHT}px`, top: `${start}px`, width: '100%' }
  if (rowStyleCache.size >= ROW_STYLE_CACHE_LIMIT) rowStyleCache.clear()
  rowStyleCache.set(start, style)
  return style
}

/** Viewport Y of the pointer that started the drag, or null for keyboard drags. */
function activatorClientY(event: DragStartEvent | DragMoveEvent): number | null {
  const clientY = (event.activatorEvent as Partial<PointerEvent> | undefined)?.clientY
  return typeof clientY === 'number' ? clientY : null
}

/** Right panel with the upcoming queue: virtualized and reorderable by drag & drop. */
export function QueuePanel() {
  const { t } = useT()
  const queue = usePlayerStore((state) => state.queue)
  const currentId = usePlayerStore((state) => state.currentId)
  const setCurrentId = usePlayerStore((state) => state.setCurrentId)
  const moveTrack = usePlayerStore((state) => state.moveTrack)
  const removeAt = usePlayerStore((state) => state.removeAt)
  const playNext = usePlayerStore((state) => state.playNext)
  const moveToEnd = usePlayerStore((state) => state.moveToEnd)
  const clearQueue = usePlayerStore((state) => state.clearQueue)

  const scrollRef = useRef<HTMLDivElement>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  /** Set when a drag just finished, to swallow the click that some browsers still emit. */
  const draggedJustEndedRef = useRef(false)
  /**
   * Viewport top of the scroll container. Refreshed on drag start and on every scroll tick
   * (cheap: once per scroll event, not per pointermove); the pointer position is derived
   * from it on every move.
   */
  const containerTopRef = useRef(0)
  /**
   * Latest pointer `clientY` while dragging, or null for keyboard drags. The scroll handler
   * needs it because auto-scroll changes `scrollTop` without emitting any `DragMove`.
   */
  const lastPointerYRef = useRef<number | null>(null)
  /** Row under the pointer while dragging, or -1 when no drag is in progress. */
  const [dragFocus, setDragFocus] = useState(-1)

  // Track ids alone can repeat when dedupe is off, so the index is part of the sortable id.
  const sortableIds = useMemo(() => queue.map((track, index) => `${track.id}#${index}`), [queue])

  /** Index of the dragged row in the current queue order, or -1 when idle. */
  const activeIndex = useMemo(
    () => (draggedId === null ? -1 : sortableIds.indexOf(draggedId)),
    [draggedId, sortableIds],
  )

  /**
   * Indices mounted while dragging: a window around the pointer that always includes the
   * dragged row. `null` when idle. Sharing this single memo between the virtualizer and
   * `SortableContext` keeps both views consistent and the strategy at O(window).
   */
  const dragIndices = useMemo(
    () =>
      dragFocus < 0 ? null : dragWindowWithActive(dragFocus, activeIndex, queue.length),
    [dragFocus, activeIndex, queue.length],
  )

  /**
   * While dragging, only a window around the pointer is mounted. Rows outside it are far
   * off-screen, so they cannot be seen or dropped on, and mounting the whole queue instead
   * would measure and mount thousands of droppables in the frame the drag starts.
   */
  const rangeExtractor = useCallback(
    (range: { startIndex: number; endIndex: number; overscan: number; count: number }) =>
      dragIndices ?? defaultRangeExtractor(range),
    [dragIndices],
  )

  const virtualizer = useVirtualizer({
    count: queue.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
    rangeExtractor,
  })

  /**
   * Ids handed to the sortable strategy. During a drag only the mounted window is passed:
   * the strategy runs on every move/scroll tick and a full-queue list made it O(N) per
   * tick. `handleDragEnd` still resolves `from`/`to` against the full `sortableIds`.
   */
  const sortableWindowIds = useMemo(() => {
    if (dragIndices === null) return sortableIds
    return dragIndices.map((index) => sortableIds[index])
  }, [dragIndices, sortableIds])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const actions = useMemo<RowActions>(
    () => ({
      onPlay: (id) => {
        if (draggedJustEndedRef.current) {
          draggedJustEndedRef.current = false
          return
        }
        setCurrentId(id, true)
      },
      onPlayNext: playNext,
      onMoveToEnd: moveToEnd,
      onRemoveAt: removeAt,
    }),
    [moveToEnd, playNext, removeAt, setCurrentId],
  )

  /** Row under `pointerY`, read from the live scroll offset so it survives auto-scroll. */
  const rowIndexAt = useCallback(
    (pointerY: number) => {
      const container = scrollRef.current
      const offset = container ? container.scrollTop + pointerY : pointerY
      return Math.min(queue.length - 1, Math.max(0, Math.floor(offset / ROW_HEIGHT)))
    },
    [queue.length],
  )

  const handleDragStart = (event: DragStartEvent) => {
    draggedJustEndedRef.current = false
    const container = scrollRef.current
    const pointerY = activatorClientY(event)
    lastPointerYRef.current = pointerY
    if (container) {
      containerTopRef.current = container.getBoundingClientRect().top
      // Keyboard drags carry no pointer position, so the window follows the dragged row itself.
      setDragFocus(
        pointerY === null
          ? sortableIds.indexOf(String(event.active.id))
          : rowIndexAt(pointerY - containerTopRef.current),
      )
    }
    setDraggedId(String(event.active.id))
  }

  const handleDragMove = (event: DragMoveEvent) => {
    const pointerY = activatorClientY(event)
    if (pointerY === null) return
    // `delta` accumulates from the pointerdown position, so this stays correct at any time.
    const currentY = pointerY + event.delta.y
    lastPointerYRef.current = currentY
    const index = rowIndexAt(currentY - containerTopRef.current)
    // Only a change of row re-renders: crossing 64px is far less often than a pointermove.
    setDragFocus((previous) => (previous === index ? previous : index))
  }

  /**
   * Covers keyboard drags (no pointer position) and any pointer move the `DragMove`
   * handler may have missed: the window follows whatever row dnd-kit reports under
   * the cursor.
   */
  const handleDragOver = (event: DragOverEvent) => {
    if (!event.over) return
    const to = sortableIds.indexOf(String(event.over.id))
    if (to < 0) return
    setDragFocus((previous) => (previous === to ? previous : to))
  }

  /**
   * Auto-scroll changes `scrollTop` without emitting `DragMove`, so without this the
   * window would go stale mid-scroll: the pointer would point at unmounted rows and the
   * drop would land on the nearest mounted one. Scroll events fire at most once per
   * frame and the state update is a no-op unless the pointer crossed into a new row.
   */
  const handleScroll = () => {
    const pointerY = lastPointerYRef.current
    if (pointerY === null) return
    const container = scrollRef.current
    if (!container) return
    containerTopRef.current = container.getBoundingClientRect().top
    const index = rowIndexAt(pointerY - containerTopRef.current)
    setDragFocus((previous) => (previous === index ? previous : index))
  }

  const resetDragState = () => {
    setDraggedId(null)
    setDragFocus(-1)
    lastPointerYRef.current = null
  }

  const handleDragEnd = (event: DragEndEvent) => {
    resetDragState()
    draggedJustEndedRef.current = true

    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = sortableIds.indexOf(String(active.id))
    const to = sortableIds.indexOf(String(over.id))
    if (from < 0 || to < 0) return
    moveTrack(from, to)
  }

  const handleDragCancel = () => {
    resetDragState()
    draggedJustEndedRef.current = true
  }

  const draggedTrack = useMemo(() => {
    if (draggedId === null) return null
    const index = sortableIds.indexOf(draggedId)
    return index >= 0 ? queue[index] : null
  }, [draggedId, queue, sortableIds])

  /**
   * This must not be memoized: the virtualizer measures the scroll area asynchronously and
   * keeps a stable instance, so a cached list would stay empty forever.
   */
  const rows = virtualizer.getVirtualItems()

  return (
    // No `contain` (neither `content` nor `layout`) on this panel: any layout or paint
    // containment turns it into the containing block for `position: fixed` descendants, and
    // dnd-kit's DragOverlay (fixed, positioned in viewport coordinates) would then be painted
    // off-screen instead of under the pointer. The virtualizer already bounds the DOM size,
    // so containment buys nothing here.
    <aside className="panel flex min-h-0 flex-1 flex-col" aria-label={t('queue.label')}>
      <header className="border-line-subtle flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-sm font-semibold tracking-tight">{t('queue.upNext')}</h2>
          <span className="bg-surface-overlay text-content-secondary shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums">
            {queue.length}
          </span>
        </div>
        {queue.length > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearQueue}
            aria-label={t('queue.clearLabel')}
            title={t('queue.clearLabel')}
          >
            <Trash2 />
            {t('queue.clear')}
          </Button>
        ) : null}
      </header>

      {queue.length === 0 ? (
        <EmptyState
          icon={<ListVideo />}
          title={t('queue.emptyTitle')}
          description={t('queue.emptyDescription', { shuffle: t('header.shuffle') })}
        />
      ) : (
        <div ref={scrollRef} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            // Only the vertical axis is constrained: clamping to the parent element
            // fought with the auto-scroll that lets you drag beyond the viewport.
            modifiers={[restrictToVerticalAxis]}
            autoScroll
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext items={sortableWindowIds} strategy={verticalListSortingStrategy}>
              <div
                className="relative w-full"
                style={{ height: `${virtualizer.getTotalSize()}px` }}
              >
                {rows.map((row) => {
                  const track = queue[row.index]
                  if (!track) return null
                  return (
                    <SortableTrackRow
                      key={sortableIds[row.index]}
                      track={track}
                      index={row.index}
                      sortableId={sortableIds[row.index]}
                      isCurrent={track.id === currentId}
                      actions={actions}
                      style={rowStyle(row.start)}
                    />
                  )
                })}
              </div>
            </SortableContext>

            <DragOverlay dropAnimation={null}>
              {draggedTrack ? <TrackRowPreview track={draggedTrack} /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}
    </aside>
  )
}
