import type { ShuffleMode } from '../types'
import type { Plural } from './types'

const plural = (one: string, other: string): Plural => ({ one, other })

/**
 * The reference dictionary: every other locale is typed against it, so a missing key is a
 * compile error rather than a runtime fallback.
 */
export const es = {
  common: {
    close: 'Cerrar',
    cancel: 'Cancelar',
    retry: 'Reintentar',
    save: 'Guardar nombre',
  },

  document: {
    title: 'YT Randomizer de Playlists',
  },

  header: {
    managePlaylists: 'Gestionar playlists',
    shuffle: 'Mezclar',
    shuffleTitle: 'Generar una mezcla nueva (S)',
    viewQueue: 'Ver la cola',
    inQueue: '{count} en la cola',
    trackCount: plural('{count} canción', '{count} canciones'),
    switchLanguage: 'Cambiar a {language}',
    languageToggle: 'Cambiar idioma',
  },

  sidebar: {
    addPlaylist: 'Añadir playlist',
  },

  playlists: {
    urlLabel: 'URL de la playlist',
    urlPlaceholder: 'Pega aquí la URL de la playlist',
    visibilityHint: 'Debe ser pública o «no listada». Ejemplo:',
    useExampleUrl: 'usar una URL de muestra',
    add: 'Añadir',
    emptyTitle: 'Todavía no hay playlists',
    emptyDescription: 'Pega arriba la URL de una playlist de YouTube o YouTube Music para empezar.',
    listTitle: 'Playlists ({count})',
    refreshAll: 'Recargar todo',
    sheetTitle: 'Playlists',
    sheetDescription: 'Añade, renombra y activa las playlists que entran en la mezcla.',
    includeInMix: 'Incluir {label} en la mezcla',
    nameLabel: 'Nombre de la playlist',
    renameTitle: 'Haz clic para renombrar',
    refreshFromYouTube: 'Recargar desde YouTube',
    refresh: 'Recargar playlist',
    openInYouTube: 'Abrir en YouTube',
    removeFromList: 'Quitar de la lista',
    remove: 'Eliminar playlist',
    trackCount: plural('{count} canción', '{count} canciones'),
    status: {
      loading: 'Cargando',
      ready: 'Lista',
      error: 'Error',
      idle: 'En espera',
    },
  },

  mode: {
    sectionTitle: 'Modo de mezcla',
    groupLabel: 'Modo de aleatorización',
    dedupe: 'Eliminar duplicados',
    dedupeDescription: 'Si una canción está en varias playlists, solo entra una vez.',
    reshuffleRounds: 'Re-mezclar las rondas',
    reshuffleRoundsDescription: 'Cambia el orden de las playlists en cada ronda.',
    footnote:
      'El modo se aplica al pulsar «{shuffle}» y también con el botón de shuffle o la tecla S.',
    modes: {
      'consecutive-random': {
        label: 'Random consecutivo',
        description: 'Alterna entre las playlists y toma una canción al azar sin repetir.',
      },
      'full-shuffle': {
        label: 'Mezcla total',
        description: 'Mezcla todas las canciones de todas las playlists en un solo pozo.',
      },
      proportional: {
        label: 'Proporcional',
        description: 'Alterna respetando el tamaño relativo de cada playlist.',
      },
      'sequential-blocks': {
        label: 'Bloques secuenciales',
        description: 'Reproduce playlist por playlist, cada una mezclada internamente.',
      },
      none: {
        label: 'Sin aleatorizar',
        description: 'Concatena las playlists en su orden original.',
      },
    } satisfies Record<ShuffleMode, { label: string; description: string }>,
  },

  player: {
    nothingPlaying: 'Sin reproducción',
    shuffleTooltip: 'Aleatorizar (S)',
    shuffleQueue: 'Aleatorizar la cola',
    previousTooltip: 'Anterior (Shift + ←)',
    previous: 'Pista anterior',
    play: 'Reproducir',
    pause: 'Pausar',
    nextTooltip: 'Siguiente (Shift + →)',
    next: 'Pista siguiente',
    repeat: {
      off: 'Repetir: desactivado',
      all: 'Repetir toda la cola',
      one: 'Repetir esta canción',
    },
    collapseBarTooltip: 'Contraer la barra',
    expandBarTooltip: 'Expandir la barra',
    collapseBar: 'Contraer la barra del reproductor',
    expandBar: 'Expandir la barra del reproductor',
    unmuteTooltip: 'Activar sonido (M)',
    muteTooltip: 'Silenciar (M)',
    unmute: 'Activar sonido',
    mute: 'Silenciar',
    volume: 'Volumen',
    position: 'Posición de reproducción',
    youtubePlayer: 'Reproductor de YouTube',
    emptyTitle: 'Nada que reproducir todavía',
    emptyDescription:
      'Añade playlists, pulsa «{shuffle}» y dale al play. El vídeo se reproduce aquí; los controles los gestiona la barra inferior.',
    theater: 'Modo cine',
    exitTheater: 'Salir del modo cine',
    fullscreen: 'Pantalla completa',
  },

  queue: {
    label: 'Cola de reproducción',
    upNext: 'A continuación',
    clear: 'Vaciar',
    clearLabel: 'Vaciar la cola',
    emptyTitle: 'La cola está vacía',
    emptyDescription: 'Pulsa «{shuffle}» para generar una lista a partir de tus playlists.',
    sheetTitle: 'Cola de reproducción',
    sheetDescription: 'Lista de las canciones que se reproduirán a continuación.',
    reorder: 'Reordenar {title}',
    playTrack: 'Reproducir {title}',
    unavailable: 'No disponible',
    rowMenu: 'Opciones de la pista {index}',
    playNow: 'Reproducir ahora',
    playNext: 'Reproducir siguiente',
    moveToEnd: 'Mover al final',
    remove: 'Quitar de la cola',
  },

  hotkeys: {
    title: 'Atajos:',
    space: 'Espacio',
    playPause: 'play/pausa',
    seek: '±5 s',
    changeTrack: 'cambian de pista',
    mute: 'silencia',
    reshuffle: 're-mezcla',
  },

  toast: {
    noPlaylists: 'No hay playlists cargadas',
    noPlaylistsDescription: 'Añade al menos una playlist con canciones antes de mezclar.',
    emptyMix: 'La mezcla quedó vacía',
    queueGenerated: plural('Cola generada: {count} canción', 'Cola generada: {count} canciones'),
    invalidUrl: 'URL no válida',
    playlistAdded: 'Playlist añadida',
    playlistRefreshing: 'Actualizando playlist',
    loadingTracks: 'Cargando sus canciones…',
    rereadingList: 'Volviendo a leer la lista.',
    playlistRemoved: 'Playlist eliminada',
    videoUnavailable: 'Video no disponible',
    videoUnavailableDescription: 'El canal restringió la inserción o el video ya no es accesible.',
  },

  urlError: {
    empty: 'Pega una URL de playlist.',
    'invalid-url': 'La URL no es válida.',
    'unsupported-host': 'Solo se admiten URLs de YouTube o YouTube Music.',
    'missing-list-param': 'Falta el parámetro `list` en la URL.',
    'not-a-playlist': 'Esa URL no apunta a ninguna playlist.',
    'auto-mix': 'Los mixes automáticos de YouTube no se pueden leer con la API pública.',
    'liked-music': 'La lista de "Me gusta" no es accesible desde la API pública.',
  },

  apiError: {
    'missing-api-key':
      'Falta la API key de YouTube. Añádela en el archivo `.env` como YOUTUBE_API_KEY.',
    'playlist-not-found':
      'La playlist no existe. Comprueba que sea pública o esté como "no listada".',
    'playlist-not-accessible': 'No se puede leer esa playlist. Debe ser pública o "no listada".',
    'quota-exceeded': 'Se agotó la cuota diaria de la API. Inténtalo más tarde o usa otra key.',
    forbidden:
      'YouTube rechazó la petición (403). Revisa que la API de YouTube Data v3 esté habilitada en tu proyecto.',
    unknown: 'Error inesperado de la API de YouTube ({status}).',
    loadFailed: 'No se pudo cargar la playlist.',
  },

  track: {
    untitled: 'Sin título',
    unknownChannel: 'Canal desconocido',
  },
}
