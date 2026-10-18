/**
 * Node 26 defines a global `localStorage` that is undefined unless node runs
 * with --localstorage-file, hiding jsdom's. Storefront tests use this
 * in-memory Storage instead. Import it before anything that reads storage.
 */
function memoryStorage(): Storage {
  const items = new Map<string, string>()
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, String(value)),
    removeItem: (key) => void items.delete(key),
    clear: () => items.clear(),
    key: (index) => [...items.keys()][index] ?? null,
    get length() {
      return items.size
    },
  }
}

if (!globalThis.localStorage) {
  const storage = memoryStorage()
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
  })
  Object.defineProperty(window, 'localStorage', {
    value: storage,
    configurable: true,
  })
}
