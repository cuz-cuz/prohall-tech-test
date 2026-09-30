import '@testing-library/jest-dom/vitest'

const storedValues = new Map()

const memoryStorage = {
  getItem(key) {
    return storedValues.has(String(key)) ? storedValues.get(String(key)) : null
  },
  setItem(key, value) {
    storedValues.set(String(key), String(value))
  },
  removeItem(key) {
    storedValues.delete(String(key))
  },
  clear() {
    storedValues.clear()
  },
  key(index) {
    return Array.from(storedValues.keys())[index] ?? null
  },
  get length() {
    return storedValues.size
  },
}

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: memoryStorage,
})
