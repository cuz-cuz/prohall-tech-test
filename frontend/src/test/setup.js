import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// jsdom does not implement scrolling; the storefront scrolls to the top on navigation.
window.scrollTo = vi.fn()

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
