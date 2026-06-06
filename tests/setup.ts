import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Electron IPC for renderer process tests
vi.mock('@electron', () => ({
  ipcRenderer: {
    invoke: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
    send: vi.fn()
  }
}))

// Mock window.matchMedia for theme tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Mock ResizeObserver
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock DOMParser
globalThis.DOMParser = vi.fn().mockImplementation(() => ({
  parseFromString: vi.fn(() => document.implementation.createHTMLDocument(''))
})) as unknown as typeof DOMParser