/// <reference types="vitest" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Electron IPC types
interface ElectronAPI {
  readFile: (path: string) => Promise<{ content: string; path: string; size: number }>
  writeFile: (path: string, content: string) => Promise<void>
  openFileDialog: () => Promise<string[]>
  saveFileDialog: (defaultName?: string) => Promise<string | null>
  getAppVersion: () => Promise<string>
  onMenuAction: (callback: (action: string) => void) => void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}