import type { NextRequest } from 'next/server'
import { YoutubeApiError } from '@/lib/youtube/api'
import { loadPlaylistTracksServer } from '@/lib/youtube/server'

export const dynamic = 'force-dynamic'

const PLAYLIST_ID_RE = /^[A-Za-z0-9_-]{10,128}$/

/** Minimal in-memory rate limit: 60 req/min per IP (single instance). */
const hits = new Map<string, { count: number; resetAt: number }>()
function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = hits.get(ip)
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + 60_000 })
    return false
  }
  entry.count += 1
  return entry.count > 60
}

function httpStatusFor(code: string): number {
  switch (code) {
    case 'playlist-not-found':
      return 404
    case 'playlist-not-accessible':
    case 'forbidden':
      return 403
    case 'quota-exceeded':
      return 429
    case 'missing-api-key':
      return 500
    default:
      return 502
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const playlistId = id.trim()

  // Short-circuit the ids the public API can never read before format validation.
  if (playlistId === 'LL' || playlistId === 'WL') {
    return Response.json({ code: 'playlist-not-accessible' }, { status: 403 })
  }
  if (playlistId.startsWith('RD')) {
    return Response.json({ code: 'playlist-not-found' }, { status: 404 })
  }
  if (!PLAYLIST_ID_RE.test(playlistId)) {
    return Response.json({ code: 'playlist-not-found' }, { status: 404 })
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return Response.json({ code: 'quota-exceeded' }, { status: 429 })
  }

  const searchParams = request.nextUrl.searchParams
  const fallbacks = {
    untitled: searchParams.get('untitled')?.slice(0, 64) || 'Untitled',
    unknownChannel: searchParams.get('unknownChannel')?.slice(0, 64) || 'Unknown channel',
  }

  try {
    const tracks = await loadPlaylistTracksServer(playlistId, fallbacks, request.signal)
    return Response.json(
      { tracks },
      { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' } },
    )
  } catch (error) {
    if (error instanceof YoutubeApiError) {
      // Never leak the key or upstream payloads: only code + mapped status.
      return Response.json({ code: error.code }, { status: httpStatusFor(error.code) })
    }
    return Response.json({ code: 'unknown' }, { status: 502 })
  }
}
