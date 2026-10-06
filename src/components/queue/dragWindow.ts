/**
 * Fixed row height: the virtualizer can then position rows without measuring them.
 */
export const ROW_HEIGHT = 64

/**
 * Rows mounted on each side of the pointer while dragging.
 *
 * dnd-kit needs a droppable wherever the user is pointing, otherwise the drop lands on the
 * nearest visible row and everything in between appears to move. 30 rows is 1920px, far past
 * any reachable edge, while keeping the mounted set small enough that droppable measuring,
 * collision detection and the sortable strategies stay cheap on huge queues.
 */
export const DRAG_WINDOW = 30

/**
 * Indices to mount while dragging: a window around the row under the pointer.
 *
 * Mounting the whole queue instead is what froze the drag, because every row is a droppable
 * that dnd-kit has to measure, collide against and re-render on every scroll update.
 */
export function dragWindow(focus: number, count: number): number[] {
  const start = Math.max(0, focus - DRAG_WINDOW)
  const end = Math.min(count - 1, focus + DRAG_WINDOW)
  return Array.from({ length: end - start + 1 }, (_, offset) => start + offset)
}

/**
 * Window around the pointer that always keeps the dragged row mounted as well.
 *
 * `SortableContext` must contain the active id while a drag is running: when the user drags
 * far from the origin (row 0 to row 700), the origin would otherwise fall outside the window,
 * its droppable would unmount and the drag would break. The active row is a single extra
 * element, so the mounted set stays at most `2 * DRAG_WINDOW + 2` rows.
 */
export function dragWindowWithActive(focus: number, active: number, count: number): number[] {
  const window = dragWindow(focus, count)
  if (active < 0 || active >= count) return window
  if (window.includes(active)) return window
  // Keep indices sorted so the virtualizer and `SortableContext` see a stable order.
  const at = window.findIndex((index) => index > active)
  if (at < 0) return [...window, active]
  return [...window.slice(0, at), active, ...window.slice(at)]
}
