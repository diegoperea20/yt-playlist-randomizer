/** Format a number of seconds as `m:ss`, or `h:mm:ss` when long enough. */
export function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00'

  const seconds = Math.floor(totalSeconds % 60)
  const minutes = Math.floor((totalSeconds / 60) % 60)
  const hours = Math.floor(totalSeconds / 3600)

  const paddedSeconds = String(seconds).padStart(2, '0')
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${paddedSeconds}`
  }
  return `${minutes}:${paddedSeconds}`
}

/** Parse a YouTube ISO 8601 duration (`PT1H2M3S`, `PT3M35S`) into seconds. */
export function parseIsoDuration(iso: string | null | undefined): number {
  if (!iso) return 0

  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(iso)
  if (!match) return 0

  const [, days, hours, minutes, seconds] = match
  return (
    Number(days ?? 0) * 86400 +
    Number(hours ?? 0) * 3600 +
    Number(minutes ?? 0) * 60 +
    Number(seconds ?? 0)
  )
}

/** Build a stable, thumbnail-ready URL for a YouTube video. */
export function thumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
}
