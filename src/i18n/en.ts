import type { es } from './es'

/** Every locale must provide exactly the keys the reference dictionary declares. */
export type Dictionary = typeof es

export const en: Dictionary = {
  common: {
    close: 'Close',
    cancel: 'Cancel',
    retry: 'Retry',
    save: 'Save name',
  },

  document: {
    title: 'YT Random Playlist Player',
  },

  header: {
    managePlaylists: 'Manage playlists',
    shuffle: 'Shuffle',
    shuffleTitle: 'Generate a new mix (S)',
    viewQueue: 'View the queue',
    inQueue: '{count} in the queue',
    trackCount: { one: '{count} track', other: '{count} tracks' },
    switchLanguage: 'Switch to {language}',
    languageToggle: 'Change language',
  },

  sidebar: {
    addPlaylist: 'Add playlist',
  },

  playlists: {
    urlLabel: 'Playlist URL',
    urlPlaceholder: 'Paste the playlist URL here',
    visibilityHint: 'It must be public or "unlisted". Example:',
    useExampleUrl: 'use a sample URL',
    add: 'Add',
    emptyTitle: 'No playlists yet',
    emptyDescription: 'Paste the URL of a YouTube or YouTube Music playlist above to start.',
    listTitle: 'Playlists ({count})',
    refreshAll: 'Reload all',
    sheetTitle: 'Playlists',
    sheetDescription: 'Add, rename and enable the playlists that take part in the mix.',
    includeInMix: 'Include {label} in the mix',
    nameLabel: 'Playlist name',
    renameTitle: 'Click to rename',
    refreshFromYouTube: 'Reload from YouTube',
    refresh: 'Reload playlist',
    openInYouTube: 'Open in YouTube',
    removeFromList: 'Remove from the list',
    remove: 'Delete playlist',
    trackCount: { one: '{count} track', other: '{count} tracks' },
    status: {
      loading: 'Loading',
      ready: 'Ready',
      error: 'Error',
      idle: 'Waiting',
    },
  },

  mode: {
    sectionTitle: 'Shuffle mode',
    groupLabel: 'Randomization mode',
    dedupe: 'Remove duplicates',
    dedupeDescription: 'A track present in several playlists only enters the mix once.',
    reshuffleRounds: 'Re-shuffle the rounds',
    reshuffleRoundsDescription: 'Changes the playlist order on every round.',
    footnote:
      'The mode is applied when you press "{shuffle}", and also with the shuffle button or the S key.',
    modes: {
      'consecutive-random': {
        label: 'Consecutive random',
        description: 'Alternates between the playlists, taking one random unused track per turn.',
      },
      'full-shuffle': {
        label: 'Full shuffle',
        description: 'Mixes the tracks of every playlist into a single pool.',
      },
      proportional: {
        label: 'Proportional',
        description: 'Alternates while respecting the relative size of each playlist.',
      },
      'sequential-blocks': {
        label: 'Sequential blocks',
        description: 'Plays playlist by playlist, each one shuffled internally.',
      },
      none: {
        label: 'No randomization',
        description: 'Concatenates the playlists in their original order.',
      },
    },
  },

  player: {
    nothingPlaying: 'Nothing playing',
    shuffleTooltip: 'Shuffle (S)',
    shuffleQueue: 'Shuffle the queue',
    previousTooltip: 'Previous (Shift + ←)',
    previous: 'Previous track',
    play: 'Play',
    pause: 'Pause',
    nextTooltip: 'Next (Shift + →)',
    next: 'Next track',
    repeat: {
      off: 'Repeat: off',
      all: 'Repeat the whole queue',
      one: 'Repeat this track',
    },
    collapseBarTooltip: 'Collapse the bar',
    expandBarTooltip: 'Expand the bar',
    collapseBar: 'Collapse the player bar',
    expandBar: 'Expand the player bar',
    unmuteTooltip: 'Unmute (M)',
    muteTooltip: 'Mute (M)',
    unmute: 'Unmute',
    mute: 'Mute',
    volume: 'Volume',
    position: 'Playback position',
    youtubePlayer: 'YouTube player',
    emptyTitle: 'Nothing to play yet',
    emptyDescription:
      'Add some playlists, press "{shuffle}" and hit play. The video plays here; the bottom bar drives the controls.',
    theater: 'Theater mode',
    exitTheater: 'Exit theater mode',
    fullscreen: 'Fullscreen',
  },

  queue: {
    label: 'Playback queue',
    upNext: 'Up next',
    clear: 'Clear',
    clearLabel: 'Clear the queue',
    emptyTitle: 'The queue is empty',
    emptyDescription: 'Press "{shuffle}" to build a queue from your playlists.',
    sheetTitle: 'Playback queue',
    sheetDescription: 'The tracks that will play next.',
    reorder: 'Reorder {title}',
    playTrack: 'Play {title}',
    unavailable: 'Not available',
    rowMenu: 'Options for track {index}',
    playNow: 'Play now',
    playNext: 'Play next',
    moveToEnd: 'Move to the end',
    remove: 'Remove from the queue',
  },

  hotkeys: {
    title: 'Shortcuts:',
    space: 'Space',
    playPause: 'play/pause',
    seek: '±5 s',
    changeTrack: 'change track',
    mute: 'mute',
    reshuffle: 're-shuffle',
  },

  toast: {
    noPlaylists: 'No playlists loaded',
    noPlaylistsDescription: 'Add at least one playlist with tracks before shuffling.',
    emptyMix: 'The mix came out empty',
    queueGenerated: {
      one: 'Queue generated: {count} track',
      other: 'Queue generated: {count} tracks',
    },
    invalidUrl: 'Invalid URL',
    playlistAdded: 'Playlist added',
    playlistRefreshing: 'Updating playlist',
    loadingTracks: 'Loading its tracks…',
    rereadingList: 'Reading the list again.',
    playlistRemoved: 'Playlist removed',
    videoUnavailable: 'Video not available',
    videoUnavailableDescription:
      'The channel disabled embedding or the video is no longer accessible.',
  },

  urlError: {
    empty: 'Paste a playlist URL.',
    'invalid-url': 'The URL is not valid.',
    'unsupported-host': 'Only YouTube or YouTube Music URLs are supported.',
    'missing-list-param': 'The URL is missing the `list` parameter.',
    'not-a-playlist': 'That URL does not point to any playlist.',
    'auto-mix': "YouTube's automatic mixes cannot be read with the public API.",
    'liked-music': 'The "Liked music" playlist is not accessible through the public API.',
  },

  apiError: {
    'missing-api-key':
      'The YouTube API key is missing. Add it to the `.env` file as YOUTUBE_API_KEY.',
    'playlist-not-found': 'The playlist does not exist. Check that it is public or "unlisted".',
    'playlist-not-accessible': 'That playlist cannot be read. It has to be public or "unlisted".',
    'quota-exceeded': 'The daily API quota is exhausted. Try again later or use another key.',
    forbidden:
      'YouTube rejected the request (403). Check that the YouTube Data v3 API is enabled in your project.',
    unknown: 'Unexpected error from the YouTube API ({status}).',
    loadFailed: 'The playlist could not be loaded.',
  },

  track: {
    untitled: 'Untitled',
    unknownChannel: 'Unknown channel',
  },
}
