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
  openFileDialog: () => Promise<{ canceled: boolean; filePaths: string[] }>
  openFolderDialog: () => Promise<{ canceled: boolean; filePaths: string[] }>
  saveFileDialog: (defaultName?: string) => Promise<string | null>
  getAppVersion: () => Promise<string>
  getPlatform: () => string
  onMenuAction: (callback: (action: string) => void) => void
  onFilesOpened: (callback: (paths: string[]) => void) => void
  onFolderOpened: (callback: (path: string) => void) => void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}