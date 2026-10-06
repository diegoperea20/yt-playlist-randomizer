import { z } from 'zod'

/** Playlist item: `snippet` is missing when the video was deleted or made private. */
export const playlistItemSchema = z.object({
  snippet: z
    .object({
      title: z.string().optional(),
      channelTitle: z.string().optional(),
      thumbnails: z
        .object({
          default: z.object({ url: z.string() }).optional(),
          medium: z.object({ url: z.string() }).optional(),
          high: z.object({ url: z.string() }).optional(),
        })
        .optional(),
    })
    .optional(),
  contentDetails: z.object({ videoId: z.string().optional() }).optional(),
})

export const playlistItemsResponseSchema = z.object({
  nextPageToken: z.string().nullish(),
  pageInfo: z
    .object({
      totalResults: z.number().optional(),
      resultsPerPage: z.number().optional(),
    })
    .nullish(),
  items: z.array(playlistItemSchema).catch([]),
})

export const videoItemSchema = z.object({
  id: z.string().optional(),
  contentDetails: z.object({ duration: z.string().optional() }).optional(),
  snippet: z.object({ title: z.string().optional() }).optional(),
})

export const videosResponseSchema = z.object({
  items: z.array(videoItemSchema).catch([]),
})

/** Pick the best available thumbnail, falling back to the generated `mqdefault` one. */
export function bestThumbnail(
  thumbnails:
    { default?: { url: string }; medium?: { url: string }; high?: { url: string } } | undefined,
  videoId: string,
): string {
  return (
    thumbnails?.high?.url ??
    thumbnails?.medium?.url ??
    thumbnails?.default?.url ??
    `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
  )
}
