<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Guide for AI coding agents

This file orients autonomous agents working on **yt-playlist-randoms** (aka "YT Randomizer",
Next.js edition). Read it before planning or editing. The user-facing doc is `README.md`
(English) — keep it in sync when behavior changes. This project is a 1:1 port of the Vite app
in `../yt-random-playlist`; keep feature parity with it unless explicitly told otherwise.

## 1. What this project is

Dark web app where you paste **YouTube** / **YouTube Music** playlist URLs, shuffle them with a
selectable randomization mode, and play them with a full-featured player: an "Up next" queue, a
bottom bar with controls, a seekable progress bar, volume, repeat, and **drag & drop** queue
reordering. Stack: **Next.js 16 (App Router, Turbopack), React 19, TypeScript 5, Tailwind CSS 4,
Radix UI primitives, dnd-kit, TanStack Virtual + Query, Zustand 5, zod, sonner, idb-keyval**.

Unlike the Vite original (100 % frontend), this app has a small backend: a Route Handler proxies
the YouTube Data API so the API key **never reaches the browser** (see §2).

## 2. The API key lives ONLY on the server

- The key is in `.env` as `YOUTUBE_API_KEY` (see `.env.example`). **Never** add a
  `NEXT_PUBLIC_`-prefixed copy, never reference it from client code, never log it, never return
  it (or upstream Google payloads) from the API route. **Never commit real keys** (`.env*` is
  git-ignored).
- `src/lib/youtube/server.ts` starts with `import 'server-only'` — it reads
  `process.env.YOUTUBE_API_KEY` and does the `playlistItems` + `videos` fetching, pagination
  (50/page, `nextPageToken`), and batched durations. The build fails if this module is ever
  imported from a client component.
- `src/app/api/playlist/[id]/route.ts` (`export const dynamic = 'force-dynamic'`) validates the
  id (format regex; `LL`/`WL` → 403, `RD*` → 404 — those checks run **before** the length check
  because `LL` is only 2 chars), applies a minimal in-memory rate limit (60 req/min per IP),
  forwards localized `untitled`/`unknownChannel` fallbacks as capped query params, and returns
  `{ tracks }` or `{ code }` with a mapped HTTP status. Route `params` is a `Promise` in
  Next 16 — always `await params`.
- `src/lib/youtube/api.ts` is the **shared/client** counterpart: `YoutubeApiError`, `Track`,
  `itemsToTracks`, plus `loadPlaylistTracks()` which calls our own `/api/playlist/:id` and
  rethrows typed errors. It must stay free of `process.env` and `server-only`.
- Google Cloud side: restrict the key by **server IP** (not HTTP referrer — browsers never call
  Google directly anymore) and enable only *YouTube Data API v3*.

## 3. Setup and commands

- Install: `npm install`. Dev: `npm run dev`. Production: `npm run build` + `npm start`.
  Lint: `npm run lint` (flat-config `eslint-config-next`; the `react-hooks/incompatible-library`
  warning on `useVirtualizer` and the `no-img-element` warnings on YouTube thumbnails are
  pre-existing/expected).
- After any code change, run at minimum: `npx tsc --noEmit`, `npm run lint`, and `npm run build`
  for anything touching the player/queue/API route.
- Smoke-test the backend with the production server: `GET /api/playlist/LL` → `403
  {"code":"playlist-not-accessible"}`; a real public playlist id → `200 {"tracks":[...]}`.

## 4. Source map

```
src/
  app/
    layout.tsx            # root layout (server): <html class="dark">, metadata, fonts
    page.tsx              # server wrapper: <Providers><PlayerLayout /></Providers>
    providers.tsx         # 'use client': QueryClient (staleTime 1h, retry 1, no refetch on
                          #   focus) + TooltipProvider + PlayerBridgeProvider + Toaster;
                          #   rehydrates the three persisted stores on mount (see §6) and
                          #   applies the document locale
    globals.css           # Tailwind 4 theme (oklch tokens), .panel, mount animations
    api/playlist/[id]/route.ts  # backend proxy (see §2)
  types.ts                # Track, Playlist, PlaylistMeta, ShuffleMode, RepeatMode (pure)
  lib/
    youtube/parseUrl.ts   # extracts `list=`; rejects RD mixes and LL with codes (pure)
    youtube/api.ts        # shared/client: error codes, itemsToTracks, backend fetch (pure)
    youtube/server.ts     # server-only: key + YouTube fetching (never import from client)
    youtube/schemas.ts    # zod validation of API responses (pure)
    youtube/cache.ts      # track cache in IndexedDB via idb-keyval ('use client')
    youtube/player.ts     # IFrame API types and player options (pure)
    shuffle/              # fisherYates, consecutiveRandom, fullShuffle, proportional, blocks (pure)
    time.ts               # m:ss formatting, ISO 8601 parsing (pure)
    mediaSession.ts       # Media Session API wiring ('use client', effect-only)
    debouncedStorage.ts   # zustand persist storage: coalesces writes, skips unchanged slices
    noopStorage.ts        # SSR-safe localStorage accessor (server returns a noop Storage)
    utils.ts              # cn() (pure)
  store/
    playlistsStore.ts     # metadata + shuffle options (persisted; heavy tracks in IDB)
    playlistsSelectors.ts # pure selectors
    playerStore.ts        # queue, currentId, playback state (persisted slice, see §6)
    settingsStore.ts      # locale (persisted)
  hooks/                  # usePlaylistManager (queries /api), useShuffleQueue,
                          # usePlayerBridge, useYouTubePlayer, useHotkeys, useMediaQuery
                          # (all 'use client')
  components/
    layout/               # Header, Sidebar, PlayerLayout (desktop grid / mobile Dialog sheets)
    playlists/            # URL input, playlist rows, ModeSelector
    player/               # VideoStage (react-youtube via dynamic ssr:false, 250 ms polling),
                          # PlayerBar, ProgressBar, VolumeControl
    queue/                # QueuePanel, SortableTrackRow, dragWindow (see §5)
    ui/                   # in-house components on Radix (button, dialog, slider, dropdown-menu…)
  i18n/                   # es.ts, en.ts, translate.ts, locales.ts, keys.ts (pure);
                          # useT.ts, applyDocumentLocale.ts ('use client')
```

## 5. Queue drag & drop — hard-won invariants (do not regress)

Ported verbatim from the Vite app. The queue combines `@tanstack/react-virtual` (fixed
`ROW_HEIGHT = 64`) with `@dnd-kit/sortable`. Respect these rules:

1. **Windowing**: while dragging, mount at most a ±30-row window around the pointer **plus the
   dragged row** (`dragWindowWithActive` in `queue/dragWindow.ts`, max 62 rows) via the
   virtualizer's `rangeExtractor`. `SortableContext` must receive **only the mounted window ids**.
2. **Follow auto-scroll and keyboard**: `dragFocus` must update on `onDragMove` **and** on
   container `onScroll` **and** on `onDragOver`. Keep the last pointer `clientY` in a ref.
3. **Overlay must track the pointer**: `DragOverlay` is `position: fixed`. **Never put `contain`
   (layout *or* paint), `transform`/`translate`, `filter`, or `perspective` on the queue panel
   `aside` or the mobile `DialogContent`**. Center the sheet with margins, not translates.
4. **Active row is a pinned placeholder**: when `isDragging`, `SortableTrackRow` must NOT apply
   the sortable `transform`/`transition` (dim with `opacity-40` instead).
5. **Position rows with `top`, never `translateY`**.
6. **Stable identities during drag**: `sortableIds` embed the index (`${id}#${index}`); `rowStyle`
   objects are cached (bounded); `actions` are memoized.
7. `useMediaQuery` uses `useSyncExternalStore` with a `false` server snapshot — desktop-only
   panels render only after hydration, by design.

## 6. Persistence, SSR, and player invariants

- Client components still prerender on the server: **no `window`/`document`/`localStorage`/
  `navigator` at module scope or during render** — only inside effects/event handlers, or behind
  `typeof window !== 'undefined'`. `debouncedStorage.ts` uses global `setTimeout`/`clearTimeout`
  (not `window.*`) for this reason.
- All three persisted stores (`player`, `playlists`, `settings`) use `skipHydration: true` with
  SSR-safe storage (`getClientStorage()`), and `Providers` calls `.persist.rehydrate()` on mount.
  This keeps the first client render identical to the prerendered HTML (no hydration mismatch);
  persisted state applies right after. Do not remove `skipHydration` without handling the
  server/client snapshot split (see `useMediaQuery` pattern).
- `currentId` (not an index) is the source of truth for what's playing.
- `playerStore` persists only `{queue, currentId, volume, muted, repeat}` (`partialize`) through
  `createDebouncedStorage` (400 ms coalescing + flush on `pagehide`/`visibilitychange`) with the
  `isPersistedPlayerEqual` comparator: `setTime` ticks must never schedule a serialization.
- Tracks live in IndexedDB; only metadata goes to `localStorage` (~5 MB cap).
- Never auto-resume audio on reload (`merge` forces `isPlaying: false`).
- IFrame rejections (errors 100/101/150) → `markUnavailable`: toast + skip without stopping.
- `VideoStage` loads `react-youtube` via `next/dynamic` with `ssr: false` (it touches `window` on
  import). Progress is polled on a 250 ms `setInterval`: the IFrame API emits no time events.

## 7. Conventions

- **Language**: code, comments, commit messages, `AGENTS.md`, and `README.md` in English;
  user-facing strings in `src/i18n/en.ts` **and** `src/i18n/es.ts` (both, always). No emojis.
- **Client boundaries**: `'use client'` goes on the entry file of each client subtree (already
  applied to all of `components/`, `hooks/`, the three `persist` stores, `youtube/cache.ts`,
  `mediaSession.ts`, `debouncedStorage.ts`, `i18n/useT.ts`, `i18n/applyDocumentLocale.ts`).
  Everything else stays pure/server-compatible so route code and shared lib can import it.
- **Styling**: Tailwind utilities (+ a few `@utility`/component classes in `globals.css`); no CSS
  modules. Shared surface class: `.panel`. Dark-only theme via oklch tokens.
- **State**: Zustand stores with one selector per subscribed field; actions memoized with
  `useMemo` where passed as props.
- **Commits**: short conventional prefixes (`fix:`, `feat:`). Only commit/push/PR when explicitly
  asked; never commit secrets.
- **Docs**: when behavior changes, update `README.md` (and the Vite `README.md`/`README.es.md`
  if the change originates there — keep the siblings in sync).

## 8. Known limitations (don't "fix" without discussion)

- Auto mixes (`list=RD…`) and the Liked list (`LL`) are unreadable via the public API — rejected
  with an explanatory message, by design.
- The video element can't be hidden (YouTube ToS); central panel + cinema/fullscreen only.
- Background-tab throttling is mitigated via Media Session API, not solved.
- The in-memory API rate limit is per-instance; a multi-instance deployment needs a shared store.
