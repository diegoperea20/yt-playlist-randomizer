/**
 * Noop `Storage` for server-side prerendering: `window.localStorage` does not
 * exist on the server, and zustand `persist` touches storage at store creation.
 * Client bundles always get the real `localStorage` via the getters below.
 */
export function getClientStorage(): Storage {
  if (typeof window !== 'undefined') return window.localStorage
  return noopStorage
}

const noopStorage: Storage = {
  get length() {
    return 0
  },
  key: () => null,
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
}
